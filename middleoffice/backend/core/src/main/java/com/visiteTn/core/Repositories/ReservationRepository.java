package com.visiteTn.core.Repositories;

import com.visiteTn.core.entities.Reservation;
import com.visiteTn.core.entities.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    List<Reservation> findByKeycloakUserId(String keycloakUserId);

    List<Reservation> findByPlace(Place place);

    List<Reservation> findByStatus(Reservation.Status status);

    // Retourne les IDs des places occupées dans une période donnée
    @Query("""
        SELECT r.place.id FROM Reservation r
        WHERE r.status <> 'CANCELLED'
        AND r.startDate < :endDate
        AND r.endDate > :startDate
    """)
    List<Integer> findOccupiedPlaceIds(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate")   LocalDateTime endDate
    );
}
