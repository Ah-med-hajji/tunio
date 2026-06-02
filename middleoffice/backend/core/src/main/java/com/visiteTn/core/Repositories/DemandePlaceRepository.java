package com.visiteTn.core.Repositories;


import com.visiteTn.core.entities.DemandePlace;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandePlaceRepository extends JpaRepository<DemandePlace, Integer> {

    // Toutes les demandes en attente
    List<DemandePlace> findByStatut(DemandePlace.StatutDemande statut);

    // Demandes d'un client spécifique
    List<DemandePlace> findByClientUsername(String clientUsername);
}
