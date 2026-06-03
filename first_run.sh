#!/bin/bash
# =============================================================================
#  TUNEO — first_run.sh
#  Full automatic setup + data seed + launch on a fresh machine
#  Safe to re-run: each step skips if already done.
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
echo -e "  ${BOLD}Installation complète et premier lancement de Tuneo${RESET}"
echo -e "  Ce script installe tout automatiquement. Asseyez-vous !"
echo ""

# =============================================================================
title "1/9  Vérification et installation des prérequis"
# =============================================================================

# Java 21+
if java -version 2>&1 | grep -qE '"(2[1-9]|[3-9][0-9])'; then
    ok "Java $(java -version 2>&1 | head -1 | awk -F'"' '{print $2}') détecté"
else
    info "Installation de Java 21..."
    sudo apt-get update -qq
    sudo apt-get install -y openjdk-21-jdk -qq
    export JAVA_HOME
    JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:/bin/java::")
    ok "Java 21 installé"
fi

# Node 20+
if node --version 2>/dev/null | grep -qE "^v(2[0-9]|[3-9][0-9])"; then
    ok "Node $(node --version) détecté"
else
    info "Installation de Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq
    sudo apt-get install -y nodejs -qq
    ok "Node $(node --version) installé"
fi

# Python3 (used for JSON parsing)
if ! command -v python3 >/dev/null 2>&1; then
    sudo apt-get install -y python3 -qq
fi

# MySQL
if mysqladmin ping --silent 2>/dev/null; then
    ok "MySQL déjà en cours d'exécution"
else
    if ! command -v mysqld >/dev/null 2>&1 && ! command -v mysql >/dev/null 2>&1; then
        info "Installation de MySQL..."
        sudo apt-get install -y mysql-server -qq
    fi
    info "Démarrage de MySQL..."
    sudo service mysql start 2>/dev/null || sudo systemctl start mysql 2>/dev/null || true
    sleep 2
    # Allow root login without password (dev only)
    sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;" 2>/dev/null || true
    mysqladmin ping --silent 2>/dev/null && ok "MySQL démarré" || die "Impossible de démarrer MySQL"
fi

# Docker (for Keycloak)
DOCKER_CMD="docker"
if ! command -v docker >/dev/null 2>&1; then
    info "Installation de Docker..."
    curl -fsSL https://get.docker.com | sudo sh -qq
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    DOCKER_CMD="sudo docker"
    ok "Docker installé"
elif ! docker info >/dev/null 2>&1; then
    # Installed but current user isn't in docker group yet
    DOCKER_CMD="sudo docker"
    ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') détecté (mode sudo)"
else
    ok "Docker $(docker --version | awk '{print $3}' | tr -d ',') détecté"
fi

# =============================================================================
title "2/9  Base de données"
# =============================================================================

info "Création de la base 'visite' si nécessaire..."
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS visite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null \
    || mysql -u root -e "CREATE DATABASE IF NOT EXISTS visite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null \
    || die "Impossible de créer la base de données"
ok "Base 'visite' prête"

# =============================================================================
title "3/9  Keycloak (identité et authentification)"
# =============================================================================

# Check if TUNEO realm is already fully configured
if curl -s --max-time 5 "http://localhost:9090/realms/TUNEO" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('realm')=='TUNEO' else 1)" 2>/dev/null; then
    ok "Realm TUNEO déjà configuré et actif — étape Keycloak ignorée"
    KEYCLOAK_SKIP=true
else
    KEYCLOAK_SKIP=false

    # Start or create Keycloak container
    if $DOCKER_CMD inspect keycloak_tuneo >/dev/null 2>&1; then
        info "Redémarrage du conteneur Keycloak existant..."
        $DOCKER_CMD start keycloak_tuneo >/dev/null 2>&1 || true
    else
        info "Création du conteneur Keycloak..."
        $DOCKER_CMD run -d \
          --name keycloak_tuneo \
          -p 9090:8080 \
          -e KEYCLOAK_ADMIN=admin \
          -e KEYCLOAK_ADMIN_PASSWORD=password \
          quay.io/keycloak/keycloak:latest start-dev \
          >/dev/null 2>&1 || die "Impossible de démarrer Keycloak"
    fi

    info "Attente du démarrage de Keycloak (jusqu'à 2 minutes)..."
    for i in $(seq 1 40); do
        if curl -s --max-time 3 "http://localhost:9090/realms/master" 2>/dev/null | grep -q '"realm"'; then break; fi
        printf "."
        sleep 3
    done
    echo ""
    curl -s --max-time 3 "http://localhost:9090/realms/master" 2>/dev/null | grep -q '"realm"' \
        || die "Keycloak n'a pas démarré dans les temps"
    ok "Keycloak prêt"

    # Get admin token
    KC_TOKEN=$(curl -s -X POST "http://localhost:9090/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password&client_id=admin-cli&username=admin&password=password" \
      | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

    [ -n "$KC_TOKEN" ] || die "Impossible d'obtenir un token Keycloak admin"

    # Create realm TUNEO
    curl -s -o /dev/null -X POST "http://localhost:9090/admin/realms" \
      -H "Authorization: Bearer $KC_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"realm":"TUNEO","enabled":true,"registrationAllowed":false,"resetPasswordAllowed":true,"loginWithEmailAllowed":true}' || true

    # Create client tuneoproject
    curl -s -o /dev/null -X POST "http://localhost:9090/admin/realms/TUNEO/clients" \
      -H "Authorization: Bearer $KC_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "clientId":"tuneoproject","enabled":true,"publicClient":true,
        "redirectUris":["http://localhost:4200/*"],"webOrigins":["http://localhost:4200"],
        "standardFlowEnabled":true,"directAccessGrantsEnabled":true,
        "attributes":{"pkce.code.challenge.method":"S256"}
      }' || true

    # Create realm roles
    for ROLE in role_admin role_partner role_user; do
        curl -s -o /dev/null -X POST "http://localhost:9090/admin/realms/TUNEO/roles" \
          -H "Authorization: Bearer $KC_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"name\":\"$ROLE\"}" || true
    done

    # Helper: create user + assign role
    create_kc_user() {
        local USERNAME=$1 PASSWORD=$2 ROLE=$3 FNAME=$4 LNAME=$5 EMAIL=$6
        curl -s -o /dev/null -X POST "http://localhost:9090/admin/realms/TUNEO/users" \
          -H "Authorization: Bearer $KC_TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"username\":\"$USERNAME\",\"enabled\":true,\"firstName\":\"$FNAME\",\"lastName\":\"$LNAME\",
               \"email\":\"$EMAIL\",\"credentials\":[{\"type\":\"password\",\"value\":\"$PASSWORD\",\"temporary\":false}]}" || true

        local UID
        UID=$(curl -s "http://localhost:9090/admin/realms/TUNEO/users?username=$USERNAME" \
          -H "Authorization: Bearer $KC_TOKEN" \
          | python3 -c "import sys,json; u=json.load(sys.stdin); print(u[0]['id'] if u else '')" 2>/dev/null)

        local RID
        RID=$(curl -s "http://localhost:9090/admin/realms/TUNEO/roles/$ROLE" \
          -H "Authorization: Bearer $KC_TOKEN" \
          | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

        if [ -n "$UID" ] && [ -n "$RID" ]; then
            curl -s -o /dev/null -X POST \
              "http://localhost:9090/admin/realms/TUNEO/users/$UID/role-mappings/realm" \
              -H "Authorization: Bearer $KC_TOKEN" -H "Content-Type: application/json" \
              -d "[{\"id\":\"$RID\",\"name\":\"$ROLE\"}]" || true
        fi

        echo "$UID"
    }

    create_kc_user "admin"   "admin123"   "role_admin"   "Admin"       "Tuneo"  "admin@tuneo.tn"   >/dev/null
    create_kc_user "partner" "partner123" "role_partner" "Partenaire"  "Tuneo"  "partner@tuneo.tn" >/dev/null
    USER_KC_UUID=$(create_kc_user "user" "user123" "role_user" "Utilisateur" "Tuneo" "user@tuneo.tn")

    ok "Realm TUNEO configuré"
    echo -e "\n   ${BOLD}Identifiants :${RESET}  admin/admin123   partner/partner123   user/user123"
fi

# =============================================================================
title "4/9  Dépendances frontend (npm install)"
# =============================================================================

if [ -f "$FRONTEND/node_modules/.bin/ng" ]; then
    ok "Dépendances frontend déjà installées — npm install ignoré"
else
    info "Installation des modules Node.js (2-3 minutes)..."
    cd "$FRONTEND"
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --silent || die "npm install a échoué"
    ok "Dépendances frontend installées"
fi

# =============================================================================
title "5/9  Démarrage du backend Spring Boot"
# =============================================================================

chmod +x "$BACKEND/mvnw" 2>/dev/null || true

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/categories 2>/dev/null | grep -qE "^(200|401|403)$"; then
    ok "Backend déjà en cours d'exécution (port 8081)"
else
    lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
    info "Démarrage du backend (téléchargement Maven au premier lancement : 3-5 min)..."
    cd "$BACKEND"
    nohup ./mvnw spring-boot:run > /tmp/tuneo_backend.log 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > /tmp/tuneo_backend.pid

    info "Attente du backend..."
    READY=false
    for i in $(seq 1 80); do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/api/categories 2>/dev/null)
        if echo "$CODE" | grep -qE "^(200|401|403)$"; then READY=true; break; fi
        printf "."
        sleep 3
    done
    echo ""
    $READY || die "Le backend n'a pas démarré dans les temps. Vérifiez : tail -f /tmp/tuneo_backend.log"
    ok "Backend démarré (PID $BACKEND_PID)"
fi

# =============================================================================
title "6/9  Migrations de schéma"
# =============================================================================

# Apply schema migrations now that Hibernate has created the tables
MIGRATIONS_DIR="$SCRIPT_DIR/middleoffice/db/migrations"
for SQL_FILE in "$MIGRATIONS_DIR"/V*.sql; do
    [ -f "$SQL_FILE" ] || continue
    FNAME=$(basename "$SQL_FILE")
    sudo mysql -u root visite < "$SQL_FILE" 2>/dev/null \
        && ok "Migration appliquée : $FNAME" \
        || warn "Migration ignorée (déjà appliquée) : $FNAME"
done

# =============================================================================
title "7/9  Données de démonstration"
# =============================================================================

PLACES_EXIST=$(sudo mysql -u root visite -sN -e "SELECT COUNT(*) FROM places WHERE id IN (6,29,34);" 2>/dev/null || echo "0")
if [ "$PLACES_EXIST" -ge 3 ] 2>/dev/null; then
    ok "Données de démonstration déjà présentes"
else
    info "Insertion des données de démonstration..."
    sudo mysql -u root visite 2>/dev/null << 'SQLEOF'
-- Categories
INSERT IGNORE INTO categories (id, name, icon, description, color, created_at) VALUES
(1,'Hôtellerie','🏨','Hébergements et hôtels','#3B82F6',NOW()),
(2,'Restauration','🍽️','Restaurants et gastronomie','#F59E0B',NOW()),
(3,'Café & Lounge','☕','Cafés, salons de thé et lounges','#8B5CF6',NOW()),
(4,'Hébergement','🏡','Maisons d hôtes et riads','#10B981',NOW()),
(5,'Bien-être & Spa','🧖','Hammams, spas et centres de bien-être','#EC4899',NOW()),
(6,'Espace de travail','💼','Coworkings et salles de réunion','#6366F1',NOW());

-- Places owned by partner
INSERT IGNORE INTO places
  (id,name,description,address,phone,email,category_id,average_rating,is_featured,created_at,owner_username)
VALUES
(6,'Four Seasons Hotel Tunis','Hôtel 5 étoiles avec vue panoramique sur le lac de Tunis.',
 'Lac Tunis, Tunis 1053','+216 71 433 500','info@fourseasons-tunis.com',1,4.9,1,NOW(),'partner'),
(29,'Dar El Jeld','Restaurant gastronomique tunisien dans un palais du XVIIIe siècle.',
 'Rue Dar El Jeld, Médina, Tunis 1008','+216 71 560 916','contact@dareljeld.tn',2,4.8,1,NOW(),'partner'),
(34,'Café Jasmin','Café traditionnel à Sidi Bou Saïd avec vue mer.',
 'Rue Habib Thameur, Sidi Bou Saïd','+216 71 740 100','info@cafejasmin.tn',3,4.6,0,NOW(),'partner');

-- Other places
INSERT IGNORE INTO places
  (id,name,description,address,phone,email,category_id,average_rating,is_featured,created_at,owner_username)
VALUES
(8,'Ramada Plaza Tunis','Hôtel business au centre-ville.',
 'Avenue Mohamed V, Tunis','+216 71 782 200','info@ramada-tunis.com',1,4.2,0,NOW(),NULL),
(9,'Sheraton Tunis Hotel','Hôtel international avec piscine.',
 'Avenue de la Ligue Arabe, Tunis','+216 71 782 100','info@sheraton-tunis.com',1,4.3,1,NOW(),NULL),
(10,'Mövenpick Resort Sousse','Resort 5 étoiles avec accès plage.',
 'Bld du 14 Janvier, Sousse','+216 73 227 800','info@movenpick-sousse.com',1,4.7,1,NOW(),NULL),
(11,'Sousse Pearl Marriott','Resort de luxe avec spa.',
 'Route de la Corniche, Sousse','+216 73 200 100','info@marriott-sousse.com',1,4.5,1,NOW(),NULL),
(22,'The Mora Sahara Tozeur','Hôtel de charme au cœur des oasis.',
 'Route Touristique, Tozeur','+216 76 462 100','info@themora-tozeur.com',1,4.8,1,NOW(),NULL);

-- Demandes for partner
INSERT IGNORE INTO demandes_place
  (name,description,address,phone,email,category_id,statut,client_username,created_at)
VALUES
('Hôtel El Mouradi Sousse','Hôtel 5 étoiles en bord de mer.',
 'Boulevard du 14 Janvier, Sousse 4000','+216 73 226 000','contact@elmouradi.tn',1,'ACCEPTED','partner','2026-05-10 09:15:00'),
('Restaurant Dar El Jeld','Restaurant tunisien en médina.',
 'Rue Dar El Jeld, Tunis 1008','+216 71 560 916','reservation@dareljeld.tn',2,'ACCEPTED','partner','2026-05-14 11:30:00'),
('Café Sidi Chabaane','Café panoramique sur la falaise de Sidi Bou Saïd.',
 'Rue de la Falaise, Sidi Bou Saïd','+216 71 740 091','info@cafesidi.tn',3,'PENDING','partner','2026-05-22 14:00:00'),
('Dar Zarrouk Maison dhôtes','Maison dhôtes de charme à Sidi Bou Saïd.',
 'Rue de la République, Sidi Bou Saïd','+216 71 740 591','contact@darzarrouk.tn',4,'PENDING','partner','2026-05-28 10:45:00'),
('Hammam El Kef Traditionnel','Hammam authentique du XIXe siècle.',
 'Rue de la Kasbah, Le Kef 7100','+216 78 221 034','hammam.elkef@gmail.com',5,'REFUSED','partner','2026-04-30 08:20:00'),
('Espace Coworking Lac II','Coworking moderne avec salles équipées.',
 'Immeuble Iris, Lac II, Tunis','+216 71 965 200','hello@coworkinglac.tn',6,'PENDING','partner','2026-06-01 16:00:00');

-- Reservations on partner places (anonymous customers)
INSERT IGNORE INTO reservations
  (keycloak_user_id,place_id,reservation_date,start_date,end_date,number_of_people,special_requests,status,created_at,updated_at)
VALUES
('demo-cust-0001',6,NOW(),'2026-06-15 14:00:00','2026-06-20 11:00:00',2,'Vue mer, étage élevé','CONFIRMED',NOW(),NOW()),
('demo-cust-0002',6,NOW(),'2026-07-01 14:00:00','2026-07-05 11:00:00',4,'Lit bébé requis','PENDING',NOW(),NOW()),
('demo-cust-0003',6,NOW(),'2026-06-28 14:00:00','2026-07-02 11:00:00',3,NULL,'CONFIRMED',NOW(),NOW()),
('demo-cust-0001',29,NOW(),'2026-06-10 12:00:00','2026-06-10 14:00:00',6,'Menu dégustation','CONFIRMED',NOW(),NOW()),
('demo-cust-0005',29,NOW(),'2026-06-20 20:00:00','2026-06-20 22:00:00',2,'Dîner romantique','PENDING',NOW(),NOW()),
('demo-cust-0002',29,NOW(),'2026-06-05 19:30:00','2026-06-05 21:30:00',10,'Réservation groupe','CANCELLED',NOW(),NOW()),
('demo-cust-0003',34,NOW(),'2026-06-12 09:00:00','2026-06-12 11:00:00',3,'Café et pâtisseries','CONFIRMED',NOW(),NOW()),
('demo-cust-0004',34,NOW(),'2026-06-25 10:00:00','2026-06-25 12:00:00',5,NULL,'PENDING',NOW(),NOW()),
('demo-cust-0005',6,NOW(),'2026-08-10 14:00:00','2026-08-17 11:00:00',2,'Lune de miel','PENDING',NOW(),NOW());
SQLEOF
    ok "Données de démonstration insérées"
fi

# Patch demo reservations for the 'user' account with their real Keycloak UUID
if [ -n "${USER_KC_UUID:-}" ]; then
    EXISTING=$(sudo mysql -u root visite -sN -e \
        "SELECT COUNT(*) FROM reservations WHERE keycloak_user_id='$USER_KC_UUID';" 2>/dev/null || echo "0")
    if [ "$EXISTING" -eq 0 ] 2>/dev/null; then
        info "Ajout de réservations de démonstration pour l'utilisateur..."
        sudo mysql -u root visite 2>/dev/null << SQLEOF2
INSERT IGNORE INTO reservations
  (keycloak_user_id,place_id,reservation_date,start_date,end_date,number_of_people,status,created_at,updated_at)
VALUES
('$USER_KC_UUID',10,NOW(),'2026-07-20 14:00:00','2026-07-25 11:00:00',2,'CONFIRMED',NOW(),NOW()),
('$USER_KC_UUID',9,NOW(),'2026-09-01 14:00:00','2026-09-05 11:00:00',3,'PENDING',NOW(),NOW());
SQLEOF2
        ok "Réservations utilisateur ajoutées"
    fi
fi

# =============================================================================
title "8/9  Démarrage du frontend Angular"
# =============================================================================

if curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null | grep -qE "^(200|304)$"; then
    ok "Frontend déjà en cours d'exécution (port 4200)"
else
    lsof -ti:4200 2>/dev/null | xargs kill -9 2>/dev/null || true
    info "Démarrage de l'application Angular..."
    cd "$FRONTEND"
    nohup ./node_modules/.bin/ng serve --host 0.0.0.0 > /tmp/tuneo_frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > /tmp/tuneo_frontend.pid

    READY=false
    for i in $(seq 1 40); do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null)
        if echo "$CODE" | grep -qE "^(200|304)$"; then READY=true; break; fi
        printf "."
        sleep 3
    done
    echo ""
    $READY || die "Le frontend n'a pas démarré. Vérifiez : tail -f /tmp/tuneo_frontend.log"
    ok "Frontend démarré (PID $FRONTEND_PID)"
fi

# =============================================================================
title "9/9  Lancement du navigateur"
# =============================================================================

cmd.exe /c start http://localhost:4200 2>/dev/null || \
  powershell.exe -Command "Start-Process 'http://localhost:4200'" 2>/dev/null || \
  xdg-open http://localhost:4200 2>/dev/null || true

echo ""
echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║      TUNEO est prêt ! Bienvenue sur la plateforme    ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║                                                      ║"
echo "  ║   Application web  →  http://localhost:4200          ║"
echo "  ║   API backend      →  http://localhost:8081          ║"
echo "  ║   Keycloak         →  http://localhost:9090          ║"
echo "  ║                                                      ║"
echo "  ║   admin / admin123      (portail admin)              ║"
echo "  ║   partner / partner123  (portail partenaire)         ║"
echo "  ║   user / user123        (portail visiteur)           ║"
echo "  ║                                                      ║"
echo "  ║   Logs  →  tail -f /tmp/tuneo_backend.log            ║"
echo "  ║   Pour redémarrer  →  start.bat                      ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""
read -p "  Appuyez sur Entrée pour fermer (les serveurs continuent en arrière-plan)..."
