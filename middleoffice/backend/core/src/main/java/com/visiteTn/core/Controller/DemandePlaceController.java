package com.visiteTn.core.Controller;

import com.visiteTn.core.entities.DemandePlace;
import com.visiteTn.core.entities.Place;
import com.visiteTn.core.Repositories.DemandePlaceRepository;
import com.visiteTn.core.Repositories.PlaceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/demandes")
@CrossOrigin(origins = "http://localhost:4200")
public class DemandePlaceController {

    private final DemandePlaceRepository demandeRepository;
    private final PlaceRepository placeRepository;

    public DemandePlaceController(DemandePlaceRepository demandeRepository,
                                  PlaceRepository placeRepository) {
        this.demandeRepository = demandeRepository;
        this.placeRepository = placeRepository;
    }

    // Client envoie une demande
    @PostMapping
    public DemandePlace create(@RequestBody DemandePlace demande) {
        demande.setStatut(DemandePlace.StatutDemande.PENDING);
        return demandeRepository.save(demande);
    }

    // Admin voit toutes les demandes
    @GetMapping
    public List<DemandePlace> getAll() {
        return demandeRepository.findAll();
    }

    // Partner voit ses propres demandes + stats
    @GetMapping("/mine")
    public ResponseEntity<Map<String, Object>> getMine(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        List<DemandePlace> demandes = demandeRepository.findByClientUsername(username);
        long pending  = demandes.stream().filter(d -> d.getStatut() == DemandePlace.StatutDemande.PENDING).count();
        long accepted = demandes.stream().filter(d -> d.getStatut() == DemandePlace.StatutDemande.ACCEPTED).count();
        long refused  = demandes.stream().filter(d -> d.getStatut() == DemandePlace.StatutDemande.REFUSED).count();
        return ResponseEntity.ok(Map.of(
            "demandes", demandes,
            "total",    demandes.size(),
            "pending",  pending,
            "accepted", accepted,
            "refused",  refused
        ));
    }

    // Admin voit les demandes en attente
    @GetMapping("/pending")
    public List<DemandePlace> getPending() {
        return demandeRepository.findByStatut(DemandePlace.StatutDemande.PENDING);
    }

    // Admin accepte → crée un Place et met à jour le statut
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> accept(@PathVariable Integer id) {
        return demandeRepository.findById(id).map(demande -> {

            // Créer le Place à partir de la demande
            Place place = new Place();
            place.setName(demande.getName());
            place.setDescription(demande.getDescription());
            place.setAddress(demande.getAddress());
            place.setPhone(demande.getPhone());
            place.setEmail(demande.getEmail());
            place.setImageUrl(demande.getImageUrl());
            place.setCategorie(demande.getCategorie());
            place.setOwnerUsername(demande.getClientUsername());
            placeRepository.save(place);

            // Mettre à jour le statut
            demande.setStatut(DemandePlace.StatutDemande.ACCEPTED);
            demandeRepository.save(demande);

            return ResponseEntity.ok("Demande acceptée et place créée ✅");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Admin refuse la demande
    @PutMapping("/{id}/refuse")
    public ResponseEntity<?> refuse(@PathVariable Integer id) {
        return demandeRepository.findById(id).map(demande -> {
            demande.setStatut(DemandePlace.StatutDemande.REFUSED);
            demandeRepository.save(demande);
            return ResponseEntity.ok("Demande refusée ❌");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Supprimer une demande
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        demandeRepository.deleteById(id);
    }
}
