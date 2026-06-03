package com.visiteTn.core.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Categorie categorie;

    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String phone;
    private String email;

    @Column(columnDefinition = "TEXT")
    private String openingHours;

    private BigDecimal averageRating = BigDecimal.ZERO;
    private Boolean isFeatured = false;
    private LocalDateTime createdAt;

    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    // Commun
    private String website;

    // ── Hotels ──────────────────────────────
    private Integer stars;
    private Integer roomsSingle;
    private Integer roomsDouble;
    private BigDecimal priceSingle;
    private BigDecimal priceDouble;
    private Boolean fullBoard = false;
    private Boolean halfBoard = false;

    // ── Restaurants ─────────────────────────
    private String cuisineType;
    private BigDecimal averagePrice;
    private Integer tableCapacity;
    private Boolean deliveryAvailable = false;

    // ── Hopitaux ────────────────────────────
    private String emergencyNumber;
    @Column(columnDefinition = "TEXT")
    private String specialties;
    private Boolean open24h = false;

    // ── Facultés ────────────────────────────
    private Integer studentCount;
    @Column(columnDefinition = "TEXT")
    private String departments;
    private BigDecimal tuitionFees;
    private Integer foundedYear;

    // ── Location voiture ────────────────────
    private Integer vehicleCount;
    private BigDecimal pricePerDay;

    // ── Café ────────────────────────────────
    private Integer seatingCapacity;
    private BigDecimal cafePrice;

    // ── Aéroport ────────────────────────────
    private String terminals;
    private Integer runways;

    // ── Musées ──────────────────────────────
    private BigDecimal ticketPrice;
    private Integer museumCapacity;

    // À ajouter dans Place.java
    private String region;

    // Ajoutez aussi le Getter et Setter
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Place() {}

    // Getters & Setters existants
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Categorie getCategorie() { return categorie; }
    public void setCategorie(Categorie categorie) { this.categorie = categorie; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOpeningHours() { return openingHours; }
    public void setOpeningHours(String openingHours) { this.openingHours = openingHours; }

    public BigDecimal getAverageRating() { return averageRating; }
    public void setAverageRating(BigDecimal averageRating) { this.averageRating = averageRating; }

    public Boolean getIsFeatured() { return isFeatured; }
    public void setIsFeatured(Boolean isFeatured) { this.isFeatured = isFeatured; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    // Getters & Setters nouveaux
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    // Hotels
    public Integer getStars() { return stars; }
    public void setStars(Integer stars) { this.stars = stars; }

    public Integer getRoomsSingle() { return roomsSingle; }
    public void setRoomsSingle(Integer roomsSingle) { this.roomsSingle = roomsSingle; }

    public Integer getRoomsDouble() { return roomsDouble; }
    public void setRoomsDouble(Integer roomsDouble) { this.roomsDouble = roomsDouble; }

    public BigDecimal getPriceSingle() { return priceSingle; }
    public void setPriceSingle(BigDecimal priceSingle) { this.priceSingle = priceSingle; }

    public BigDecimal getPriceDouble() { return priceDouble; }
    public void setPriceDouble(BigDecimal priceDouble) { this.priceDouble = priceDouble; }

    public Boolean getFullBoard() { return fullBoard; }
    public void setFullBoard(Boolean fullBoard) { this.fullBoard = fullBoard; }

    public Boolean getHalfBoard() { return halfBoard; }
    public void setHalfBoard(Boolean halfBoard) { this.halfBoard = halfBoard; }

    // Restaurants
    public String getCuisineType() { return cuisineType; }
    public void setCuisineType(String cuisineType) { this.cuisineType = cuisineType; }

    public BigDecimal getAveragePrice() { return averagePrice; }
    public void setAveragePrice(BigDecimal averagePrice) { this.averagePrice = averagePrice; }

    public Integer getTableCapacity() { return tableCapacity; }
    public void setTableCapacity(Integer tableCapacity) { this.tableCapacity = tableCapacity; }

    public Boolean getDeliveryAvailable() { return deliveryAvailable; }
    public void setDeliveryAvailable(Boolean deliveryAvailable) { this.deliveryAvailable = deliveryAvailable; }

    // Hopitaux
    public String getEmergencyNumber() { return emergencyNumber; }
    public void setEmergencyNumber(String emergencyNumber) { this.emergencyNumber = emergencyNumber; }

    public String getSpecialties() { return specialties; }
    public void setSpecialties(String specialties) { this.specialties = specialties; }

    public Boolean getOpen24h() { return open24h; }
    public void setOpen24h(Boolean open24h) { this.open24h = open24h; }

    // Facultés
    public Integer getStudentCount() { return studentCount; }
    public void setStudentCount(Integer studentCount) { this.studentCount = studentCount; }

    public String getDepartments() { return departments; }
    public void setDepartments(String departments) { this.departments = departments; }

    public BigDecimal getTuitionFees() { return tuitionFees; }
    public void setTuitionFees(BigDecimal tuitionFees) { this.tuitionFees = tuitionFees; }

    public Integer getFoundedYear() { return foundedYear; }
    public void setFoundedYear(Integer foundedYear) { this.foundedYear = foundedYear; }

    // Location voiture
    public Integer getVehicleCount() { return vehicleCount; }
    public void setVehicleCount(Integer vehicleCount) { this.vehicleCount = vehicleCount; }

    public BigDecimal getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(BigDecimal pricePerDay) { this.pricePerDay = pricePerDay; }

    // Café
    public Integer getSeatingCapacity() { return seatingCapacity; }
    public void setSeatingCapacity(Integer seatingCapacity) { this.seatingCapacity = seatingCapacity; }

    public BigDecimal getCafePrice() { return cafePrice; }
    public void setCafePrice(BigDecimal cafePrice) { this.cafePrice = cafePrice; }

    // Aéroport
    public String getTerminals() { return terminals; }
    public void setTerminals(String terminals) { this.terminals = terminals; }

    public Integer getRunways() { return runways; }
    public void setRunways(Integer runways) { this.runways = runways; }

    // Musées
    public BigDecimal getTicketPrice() { return ticketPrice; }
    public void setTicketPrice(BigDecimal ticketPrice) { this.ticketPrice = ticketPrice; }

    public Integer getMuseumCapacity() { return museumCapacity; }
    public void setMuseumCapacity(Integer museumCapacity) { this.museumCapacity = museumCapacity; }
    private Double pricePerNight;

    @Column(name = "owner_username")
    private String ownerUsername;

    public Double getPricePerNight() { return pricePerNight; }
    public void setPricePerNight(Double pricePerNight) { this.pricePerNight = pricePerNight; }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
}
