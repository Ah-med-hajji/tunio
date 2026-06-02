package com.visiteTn.core.Repositories;

import java.time.LocalDateTime;
import com.visiteTn.core.entities.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Integer> {

    List<Place> findByNameContainingIgnoreCase(String name);

    List<Place> findByCategorieId(Integer categorieId);

    List<Place> findByIsFeaturedTrue();

    List<Place> findByAverageRatingGreaterThanEqual(Double rating);

    @Query("""
        SELECT p FROM Place p
        WHERE (
            :query IS NULL OR :query = '' OR
            LOWER(p.name)    LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.address) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.region)  LIKE LOWER(CONCAT('%', :query, '%'))
        )
        AND (
            :category IS NULL OR :category = '' OR
            LOWER(p.categorie.name) LIKE LOWER(CONCAT('%', :category, '%'))
        )
        AND (
            :startDate IS NULL OR :endDate IS NULL OR
            p.id NOT IN (
                SELECT r.place.id FROM Reservation r
                WHERE r.status <> 'CANCELLED'
                AND r.startDate < :endDate
                AND r.endDate > :startDate
            )
        )
    """)
    List<Place> searchAdvanced(
            @Param("query")     String query,
            @Param("category")  String category,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate")   LocalDateTime endDate
    );
}
