package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.CategorieRepository;
import com.visiteTn.core.entities.Categorie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/categories", "/categories"})
public class CategorieController {

    @Autowired
    private CategorieRepository categorieRepository;

    @GetMapping
    public List<Categorie> getAllCategories() {
        return categorieRepository.findAll();
    }

    @PostMapping
    public Categorie createCategorie(@RequestBody Categorie categorie) {
        return categorieRepository.save(categorie);
    }

    // ✅ Endpoint PUT ajouté
    @PutMapping("/{id}")
    public ResponseEntity<Categorie> updateCategorie(@PathVariable Integer id, @RequestBody Categorie categorie) {
        return categorieRepository.findById(id)
                .map(existing -> {
                    existing.setName(categorie.getName());
                    existing.setDescription(categorie.getDescription());
                    return ResponseEntity.ok(categorieRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void deleteCategorie(@PathVariable Integer id) {
        categorieRepository.deleteById(id);
    }
}
