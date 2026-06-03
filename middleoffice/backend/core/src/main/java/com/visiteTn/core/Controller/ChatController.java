package com.visiteTn.core.Controller;

import com.visiteTn.core.entities.Place;
import com.visiteTn.core.services.PlaceService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final PlaceService placeService;

    // Régions tunisiennes connues pour le filtrage
    private static final List<String> TUNISIAN_REGIONS = Arrays.asList(
        "sousse", "tunis", "sfax", "monastir", "hammamet", "nabeul",
        "tabarka", "bizerte", "mahdia", "tozeur", "djerba", "gabès",
        "kairouan", "gafsa", "béja", "jendouba", "siliana", "zaghouan",
        "ariana", "ben arous", "manouba", "kasserine", "sidi bouzid",
        "medenine", "tataouine", "kebili"
    );

    public ChatController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping("/ping")
    public String ping() {
        return "ChatController OK - Places in DB: " + placeService.getAllPlaces().size();
    }

    @PostMapping("/ask")
    public ResponseEntity<Map<String, Object>> askChatbot(@RequestBody Map<String, Object> payload) {
        String userMessage = (String) payload.get("message");

        // Récupérer l'historique de la conversation s'il existe
        List<Map<String, String>> history = new ArrayList<>();
        Object historyObj = payload.get("history");
        if (historyObj instanceof List) {
            history = (List<Map<String, String>>) historyObj;
        }

        // ── 1. Détecter la région mentionnée dans le message ─────────────
        String msgLower = userMessage.toLowerCase();
        String detectedRegion = TUNISIAN_REGIONS.stream()
                .filter(r -> msgLower.contains(r))
                .findFirst()
                .orElse(null);

        // ── 2. Récupérer et FILTRER les établissements ───────────────────
        List<Place> allPlaces = placeService.getAllPlaces();

        // Détecter la catégorie mentionnée
        String catFilter = null;
        if (msgLower.contains("hotel") || msgLower.contains("hôtel")) catFilter = "HOTEL";
        else if (msgLower.contains("restaurant")) catFilter = "RESTAURANT";
        else if (msgLower.contains("cafe") || msgLower.contains("café")) catFilter = "CAFE";
        else if (msgLower.contains("voiture")) catFilter = "VOITURE";

        // Filtrer par région ET/OU catégorie si mentionnées
        final String regionFilter = detectedRegion;
        final String categoryFilter = catFilter;

        List<Place> filteredPlaces = allPlaces.stream()
                .filter(p -> {
                    boolean regionMatch = true;
                    boolean categoryMatch = true;

                    if (regionFilter != null) {
                        String placeRegion = p.getRegion() != null ? p.getRegion().toLowerCase() : "";
                        String placeAddress = p.getAddress() != null ? p.getAddress().toLowerCase() : "";
                        String placeName = p.getName() != null ? p.getName().toLowerCase() : "";
                        regionMatch = placeRegion.contains(regionFilter)
                                   || placeAddress.contains(regionFilter)
                                   || placeName.contains(regionFilter);
                    }

                    if (categoryFilter != null && p.getCategorie() != null && p.getCategorie().getName() != null) {
                        categoryMatch = p.getCategorie().getName().toUpperCase().contains(categoryFilter);
                    }

                    return regionMatch && categoryMatch;
                })
                .collect(Collectors.toList());

        // Si le filtre retourne rien, utiliser tous les établissements
        List<Place> placesToInject = filteredPlaces.isEmpty() ? allPlaces : filteredPlaces;

        // ── 3. Construire la liste textuelle des établissements ──────────
        String placesList = placesToInject.stream().limit(30).map(p -> {
            StringBuilder sb = new StringBuilder("• ");
            sb.append(p.getName());
            if (p.getCategorie() != null) sb.append(" [").append(p.getCategorie().getName()).append("]");
            if (p.getRegion() != null)    sb.append(" - ").append(p.getRegion());
            if (p.getAddress() != null)   sb.append(", ").append(p.getAddress());
            if (p.getPhone() != null)     sb.append(" | Tél: ").append(p.getPhone());
            if (p.getStars() != null)     sb.append(" | ").append(p.getStars()).append("★");
            if (p.getPriceSingle() != null) sb.append(" | Ch. simple: ").append(p.getPriceSingle()).append(" DT/nuit");
            if (p.getPriceDouble() != null) sb.append(" | Ch. double: ").append(p.getPriceDouble()).append(" DT/nuit");
            if (p.getPricePerDay() != null) sb.append(" | Prix/jour: ").append(p.getPricePerDay()).append(" DT");
            if (p.getCafePrice() != null)   sb.append(" | Prix moyen: ").append(p.getCafePrice()).append(" DT");
            if (p.getOpeningHours() != null) sb.append(" | Horaires: ").append(p.getOpeningHours());
            return sb.toString();
        }).collect(Collectors.joining("\n"));

        // ── 4. Statistiques globales ─────────────────────────────────────
        long totalHotels      = allPlaces.stream().filter(p -> p.getCategorie() != null && p.getCategorie().getName() != null && p.getCategorie().getName().toUpperCase().contains("HOTEL")).count();
        long totalRestaurants = allPlaces.stream().filter(p -> p.getCategorie() != null && p.getCategorie().getName() != null && p.getCategorie().getName().toUpperCase().contains("RESTAURANT")).count();
        long totalCafes       = allPlaces.stream().filter(p -> p.getCategorie() != null && p.getCategorie().getName() != null && p.getCategorie().getName().toUpperCase().contains("CAFE")).count();

        // ── 5. Prompt système ────────────────────────────────────────────
        String contextInfo = (regionFilter != null ? "Région filtrée: " + regionFilter + " | " : "") +
                             (categoryFilter != null ? "Catégorie filtrée: " + categoryFilter + " | " : "") +
                             "Résultats: " + placesToInject.size() + " établissement(s)";

        String systemPrompt = "Tu es l'assistant intelligent de Visite Tn (Tunéo), plateforme de réservation en Tunisie.\n\n" +
                "STATISTIQUES DU SITE:\n" +
                "Total: " + allPlaces.size() + " établissements | Hôtels: " + totalHotels +
                " | Restaurants: " + totalRestaurants + " | Cafés: " + totalCafes + "\n\n" +
                "DONNÉES PERTINENTES POUR CETTE QUESTION (" + contextInfo + "):\n" +
                (placesToInject.isEmpty() ? "Aucun établissement trouvé pour ces critères." : placesList) + "\n\n" +
                "RÈGLES STRICTES:\n" +
                "1. Réponds UNIQUEMENT en français.\n" +
                "2. Utilise SEULEMENT les données ci-dessus. Ne jamais inventer d'établissements.\n" +
                "3. Si la région est mentionnée, cite SEULEMENT les établissements de cette région.\n" +
                "4. Si aucun résultat, dis-le clairement et propose d'autres régions.\n" +
                "5. Sois précis sur les prix, étoiles et horaires.\n" +
                "6. Pour réserver, invite à utiliser le bouton 'Réserver maintenant' sur la fiche de l'établissement.";

        // ── 6. Construire les messages avec historique ───────────────────
        Map<String, Object> body = new HashMap<>();
        body.put("model", "llama-3.1-8b-instant");

        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        // Ajouter l'historique de conversation (max 10 derniers messages)
        int historyStart = Math.max(0, history.size() - 10);
        messages.addAll(history.subList(historyStart, history.size()));

        // Ajouter le message actuel
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        body.put("messages", messages);
        body.put("temperature", 0.3); // Plus bas = plus précis et moins hallucinatoire
        body.put("max_tokens", 600);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        // ── 7. Appel Groq ────────────────────────────────────────────────
        try {
            System.out.println("[ChatBot] Message: " + userMessage);
            System.out.println("[ChatBot] Région détectée: " + (regionFilter != null ? regionFilter : "aucune"));
            System.out.println("[ChatBot] Catégorie détectée: " + (categoryFilter != null ? categoryFilter : "aucune"));
            System.out.println("[ChatBot] Établissements injectés: " + placesToInject.size() + "/" + allPlaces.size());
            ResponseEntity<Map> response = restTemplate.postForEntity(groqApiUrl, entity, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            System.err.println("[ChatBot] Erreur Groq: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Service IA indisponible");
            error.put("details", e.getStatusCode().toString());
            // Return 503 so the frontend JWT interceptor does not misinterpret as auth failure
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        } catch (Exception e) {
            System.err.println("[ChatBot] Erreur: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Erreur interne");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }
}
