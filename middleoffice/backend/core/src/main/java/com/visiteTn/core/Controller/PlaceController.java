package com.visiteTn.core.Controller;

import com.visiteTn.core.entities.Place;
import com.visiteTn.core.Repositories.PlaceRepository;
import com.visiteTn.core.Repositories.ReservationRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/places")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class PlaceController {

    private final PlaceRepository placeRepository;
    private final ReservationRepository reservationRepository;

    public PlaceController(PlaceRepository placeRepository,
                           ReservationRepository reservationRepository) {
        this.placeRepository = placeRepository;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping
    public List<Place> getAllPlaces() {
        return placeRepository.findAll();
    }

    @GetMapping("/{id}")
    public Place getPlaceById(@PathVariable Integer id) {
        return placeRepository.findById(id).orElse(null);
    }

    @GetMapping("/featured")
    public List<Place> getFeaturedPlaces() {
        return placeRepository.findByIsFeaturedTrue();
    }

    @GetMapping("/category/{id}")
    public List<Place> getByCategorie(@PathVariable Integer id) {
        return placeRepository.findByCategorieId(id);
    }

    @GetMapping("/search")
    public List<Place> search(
            @RequestParam(required = false, defaultValue = "") String region,
            @RequestParam(required = false, defaultValue = "") String category,
            @RequestParam(required = false, defaultValue = "") String delegation,
            @RequestParam(required = false) String checkIn,
            @RequestParam(required = false) String checkOut
    ) {
        LocalDateTime startDate = null;
        LocalDateTime endDate   = null;

        if (checkIn != null && !checkIn.isEmpty() &&
                checkOut != null && !checkOut.isEmpty()) {
            startDate = LocalDate.parse(checkIn).atStartOfDay();
            endDate   = LocalDate.parse(checkOut).atStartOfDay();
        }

        String query = region.isEmpty() ? delegation : region;

        return placeRepository.searchAdvanced(query, category, startDate, endDate)
                .stream()
                .filter(p -> delegation.isEmpty() ||
                        (p.getAddress() != null &&
                                normalize(p.getAddress()).contains(normalize(delegation))))
                .toList();
    }

    // ── Dates occupées pour une place ────────────────────────────────────────
    @GetMapping("/{id}/occupied-dates")
    public List<java.util.Map<String, String>> getOccupiedDates(@PathVariable Integer id) {
        Place place = placeRepository.findById(id).orElse(null);
        if (place == null) return List.of();

        return reservationRepository.findByPlace(place)
                .stream()
                .filter(r -> r.getStatus() != com.visiteTn.core.entities.Reservation.Status.CANCELLED)
                .map(r -> java.util.Map.of(
                        "startDate", r.getStartDate().toLocalDate().toString(),
                        "endDate",   r.getEndDate().toLocalDate().toString()
                ))
                .toList();
    }

    private String normalize(String s) {
        if (s == null) return "";
        return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase()
                .trim();
    }

    @PostMapping
    public Place create(@RequestBody Place place) {
        return placeRepository.save(place);
    }

    @PutMapping("/{id}")
    public Place update(@PathVariable Integer id, @RequestBody Place data) {
        Place place = placeRepository.findById(id).orElse(null);
        if (place == null) return null;

        place.setName(data.getName());
        place.setDescription(data.getDescription());
        place.setAddress(data.getAddress());
        place.setPhone(data.getPhone());
        place.setEmail(data.getEmail());
        place.setLatitude(data.getLatitude());
        place.setLongitude(data.getLongitude());
        place.setIsFeatured(data.getIsFeatured());
        place.setAverageRating(data.getAverageRating());
        place.setCategorie(data.getCategorie());
        place.setOpeningHours(data.getOpeningHours());
        place.setImageUrl(data.getImageUrl());
        place.setWebsite(data.getWebsite());
        place.setRegion(data.getRegion());
        place.setStars(data.getStars());
        place.setRoomsSingle(data.getRoomsSingle());
        place.setRoomsDouble(data.getRoomsDouble());
        place.setPriceSingle(data.getPriceSingle());
        place.setPriceDouble(data.getPriceDouble());
        place.setFullBoard(data.getFullBoard());
        place.setHalfBoard(data.getHalfBoard());
        place.setCuisineType(data.getCuisineType());
        place.setAveragePrice(data.getAveragePrice());
        place.setTableCapacity(data.getTableCapacity());
        place.setDeliveryAvailable(data.getDeliveryAvailable());
        place.setEmergencyNumber(data.getEmergencyNumber());
        place.setSpecialties(data.getSpecialties());
        place.setOpen24h(data.getOpen24h());
        place.setStudentCount(data.getStudentCount());
        place.setDepartments(data.getDepartments());
        place.setTuitionFees(data.getTuitionFees());
        place.setFoundedYear(data.getFoundedYear());
        place.setVehicleCount(data.getVehicleCount());
        place.setPricePerDay(data.getPricePerDay());
        place.setSeatingCapacity(data.getSeatingCapacity());
        place.setCafePrice(data.getCafePrice());
        place.setTerminals(data.getTerminals());
        place.setRunways(data.getRunways());
        place.setTicketPrice(data.getTicketPrice());
        place.setMuseumCapacity(data.getMuseumCapacity());

        return placeRepository.save(place);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        placeRepository.deleteById(id);
    }
    @GetMapping("/{id}/available-capacity")
    public java.util.Map<String, Object> getAvailableCapacity(
            @PathVariable Integer id,
            @RequestParam String checkIn,
            @RequestParam String checkOut
    ) {
        Place place = placeRepository.findById(id).orElse(null);
        if (place == null) return java.util.Map.of("available", 0, "total", 0);

        // Capacité totale selon catégorie
        int total = 0;
        String catName = place.getCategorie() != null ?
                place.getCategorie().getName().toLowerCase() : "";

        if (catName.contains("hotel")) {
            total = (place.getRoomsSingle() != null ? place.getRoomsSingle() : 0)
                    + (place.getRoomsDouble() != null ? place.getRoomsDouble() : 0);
        } else if (catName.contains("restaurant")) {
            total = place.getTableCapacity() != null ? place.getTableCapacity() : 0;
        } else if (catName.contains("cafe") || catName.contains("café")) {
            total = place.getSeatingCapacity() != null ? place.getSeatingCapacity() : 0;
        } else if (catName.contains("location") || catName.contains("voiture")) {
            total = place.getVehicleCount() != null ? place.getVehicleCount() : 0;
        }

        // Capacité déjà réservée dans cette période
        LocalDateTime startDate = LocalDate.parse(checkIn).atStartOfDay();
        LocalDateTime endDate   = LocalDate.parse(checkOut).atStartOfDay();

        int reserved = reservationRepository.findByPlace(place)
                .stream()
                .filter(r -> r.getStatus() != com.visiteTn.core.entities.Reservation.Status.CANCELLED)
                .filter(r -> r.getStartDate().isBefore(endDate) && r.getEndDate().isAfter(startDate))
                .mapToInt(r -> r.getNumberOfPeople() != null ? r.getNumberOfPeople() : 0)
                .sum();

        int available = Math.max(0, total - reserved);

        return java.util.Map.of(
                "total",     total,
                "reserved",  reserved,
                "available", available
        );
    }
}
