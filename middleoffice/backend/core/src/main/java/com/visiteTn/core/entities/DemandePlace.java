package com.visiteTn.core.entities;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_place")
public class DemandePlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;
    private String phone;
    private String email;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    // Catégorie souhaitée par le client
    @ManyToOne
    @JoinColumn(name = "category_id")
    private Categorie categorie;

    // Statut : PENDING, ACCEPTED, REFUSED
    @Enumerated(EnumType.STRING)
    private StatutDemande statut = StatutDemande.PENDING;

    // Username Keycloak du client
    private String clientUsername;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum StatutDemande {
        PENDING, ACCEPTED, REFUSED
    }

    // Getters & Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Categorie getCategorie() { return categorie; }
    public void setCategorie(Categorie categorie) { this.categorie = categorie; }

    public StatutDemande getStatut() { return statut; }
    public void setStatut(StatutDemande statut) { this.statut = statut; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
