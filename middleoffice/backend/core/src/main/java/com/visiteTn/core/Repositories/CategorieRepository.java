package com.visiteTn.core.Repositories;

import java.util.Optional;

import com.visiteTn.core.entities.Categorie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface CategorieRepository extends JpaRepository<Categorie, Integer> {

    // Chercher catégorie par nom
    Optional<Categorie> findByName(String name);

    // Vérifier si une catégorie existe par nom
    Boolean existsByName(String name);
}
