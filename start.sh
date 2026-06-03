#!/bin/bash
# =============================================================================
#  TUNEO — start.sh
#  Démarrage rapide après un arrêt (first_run.bat doit avoir été lancé une fois)
# =============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()    { echo -e "  ${GREEN}✔${RESET}  $*"; }
info()  { echo -e "  ${CYAN}➜${RESET}  $*"; }
warn()  { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
die()   { echo -e "  ${RED}✘  ERREUR: $*${RESET}"; exit 1; }
title() { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$SCRIPT_DIR/middleoffice"
BACKEND="$BASE/backend/core"
FRONTEND="$BASE/frontend/tuneo"

echo -e "${BOLD}"
echo "  ████████╗██╗   ██╗███╗   ██╗███████╗ ██████╗ "
echo "  ╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔═══██╗"
echo "     ██║   ██║   ██║██╔██╗ ██║█████╗  ██║   ██║"
echo "     ██║   ██║   ██║██║╚██╗██║██╔══╝  ██║   ██║"
echo "     ██║   ╚██████╔╝██║ ╚████║███████╗╚██████╔╝"
echo "     ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ "
echo -e "${RESET}"
echo -e "  ${BOLD}Démarrage de la plateforme Tuneo${RESET}"
echo ""

# Docker command (with or without sudo depending on group membership)
if docker info >/dev/null 2>&1; then
    DOCKER_CMD="docker"
elif sudo docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"   # let it fail with a clear message later if needed
fi

# =============================================================================
title "1/4  Services système (MySQL + Keycloak)"
# =============================================================================

# ── MySQL ──────────────────────────────────────────────────────────────────
if mysqladmin ping --silent 2>/dev/null; then
    ok "MySQL actif"
else
    info "Démarrage de MySQL..."
    sudo service mysql start 2>/dev/null || sudo systemctl start mysql 2>/dev/null || true
    sleep 2
    mysqladmin ping --silent 2>/dev/null \
        && ok "MySQL démarré" \
        || die "MySQL ne démarre pas. Essayez de relancer first_run.bat"
fi

# ── Keycloak ───────────────────────────────────────────────────────────────
if curl -s --max-time 5 "http://localhost:9090/realms/TUNEO" 2>/dev/null | grep -q '"realm"'; then
    ok "Keycloak actif (realm TUNEO OK)"
elif $DOCKER_CMD start keycloak_tuneo >/dev/null 2>&1; then
    # Container existed and was restarted — TUNEO realm is stored inside
    info "Attente de Keycloak (jusqu'à 2 minutes)..."
    for i in $(seq 1 40); do
        if curl -s --max-time 3 "http://localhost:9090/realms/TUNEO" 2>/dev/null | grep -q '"realm"'; then break; fi
        printf "."
        sleep 3
    done
    echo ""
    curl -s --max-time 5 "http://localhost:9090/realms/TUNEO" 2>/dev/null | grep -q '"realm"' \
        || die "Le realm TUNEO n'est pas accessible. Relancez first_run.bat pour réinitialiser Keycloak."
    ok "Keycloak démarré"
else
    die "Conteneur Keycloak 'keycloak_tuneo' introuvable. Lancez d'abord first_run.bat."
fi

# =============================================================================
title "2/4  Backend Spring Boot"
# =============================================================================

chmod +x "$BACKEND/mvnw" 2>/dev/null || true

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/categories 2>/dev/null | grep -qE "^(200|401|403)$"; then
    ok "Backend déjà actif (port 8081)"
else
    lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
    info "Démarrage du backend Spring Boot..."
    cd "$BACKEND"
    nohup ./mvnw spring-boot:run > /tmp/tuneo_backend.log 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > /tmp/tuneo_backend.pid

    info "Attente du backend (30-60 secondes)..."
    READY=false
    for i in $(seq 1 30); do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/categories 2>/dev/null)
        if echo "$CODE" | grep -qE "^(200|401|403)$"; then READY=true; break; fi
        printf "."
        sleep 3
    done
    echo ""
    $READY || die "Le backend n'a pas démarré. Vérifiez : tail -f /tmp/tuneo_backend.log"
    ok "Backend démarré (PID $BACKEND_PID)"
fi

# =============================================================================
title "3/4  Frontend Angular"
# =============================================================================

# Guard: node_modules must exist (from first_run)
[ -f "$FRONTEND/node_modules/.bin/ng" ] \
    || die "node_modules manquant. Lancez first_run.bat pour installer les dépendances."

if curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null | grep -qE "^(200|304)$"; then
    ok "Frontend déjà actif (port 4200)"
else
    lsof -ti:4200 2>/dev/null | xargs kill -9 2>/dev/null || true
    sleep 1
    info "Démarrage du frontend Angular..."
    cd "$FRONTEND"
    nohup ./node_modules/.bin/ng serve --host 0.0.0.0 > /tmp/tuneo_frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > /tmp/tuneo_frontend.pid

    info "Attente d'Angular (30-60 secondes)..."
    READY=false
    for i in $(seq 1 40); do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null)
        if echo "$CODE" | grep -qE "^(200|304)$"; then READY=true; break; fi
        printf "."
        sleep 3
    done
    echo ""
    $READY || warn "Angular prend plus de temps que prévu. Essayez http://localhost:4200 dans quelques secondes."
    ok "Frontend démarré (PID $FRONTEND_PID)"
fi

# =============================================================================
title "4/4  Ouverture du navigateur"
# =============================================================================

cmd.exe /c start http://localhost:4200 2>/dev/null || \
  powershell.exe -Command "Start-Process 'http://localhost:4200'" 2>/dev/null || \
  xdg-open http://localhost:4200 2>/dev/null || true

echo ""
echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║           TUNEO est prêt — Bonne démonstration !     ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║                                                      ║"
echo "  ║   Application web  →  http://localhost:4200          ║"
echo "  ║   API backend      →  http://localhost:8081          ║"
echo "  ║   Keycloak         →  http://localhost:9090          ║"
echo "  ║                                                      ║"
echo "  ║   admin / admin123      partner / partner123         ║"
echo "  ║   user / user123                                     ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
read -p "  Appuyez sur Entrée pour fermer (les serveurs continuent en arrière-plan)..."
