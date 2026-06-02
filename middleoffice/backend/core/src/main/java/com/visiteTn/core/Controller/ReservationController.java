package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.PlaceRepository;
import com.visiteTn.core.Repositories.ReservationRepository;
import com.visiteTn.core.entities.Place;
import com.visiteTn.core.entities.Reservation;
import com.visiteTn.core.services.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final PlaceRepository placeRepository;
    private final PdfService pdfService;

    public ReservationController(ReservationRepository reservationRepository,
                                 PlaceRepository placeRepository,
                                 PdfService pdfService) {
        this.reservationRepository = reservationRepository;
        this.placeRepository = placeRepository;
        this.pdfService = pdfService;
    }

    // ── Admin ──────────────────────────────────────────────────────────────
    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getById(@PathVariable Integer id,
                                               @AuthenticationPrincipal Jwt jwt) {
        Reservation r = reservationRepository.findById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        if (!isAdmin(jwt) && !ownsReservation(jwt, r)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(r);
    }

    @GetMapping("/place/{placeId}")
    public List<Reservation> getByPlace(@PathVariable Integer placeId) {
        Place place = placeRepository.findById(placeId).orElse(null);
        return place != null ? reservationRepository.findByPlace(place) : List.of();
    }

    // ── Current user ──────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<List<Reservation>> getMyReservations(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(401).build();
        List<Reservation> mine = reservationRepository.findByKeycloakUserId(jwt.getSubject());
        mine.sort(Comparator.comparing(
                Reservation::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return ResponseEntity.ok(mine);
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<Map<String, Object>> myDashboard(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(401).build();
        List<Reservation> mine = reservationRepository.findByKeycloakUserId(jwt.getSubject());
        LocalDateTime now = LocalDateTime.now();

        long pending   = mine.stream().filter(r -> r.getStatus() == Reservation.Status.PENDING).count();
        long confirmed = mine.stream().filter(r -> r.getStatus() == Reservation.Status.CONFIRMED).count();
        long cancelled = mine.stream().filter(r -> r.getStatus() == Reservation.Status.CANCELLED).count();

        List<Reservation> upcoming = mine.stream()
                .filter(r -> r.getStatus() != Reservation.Status.CANCELLED)
                .filter(r -> r.getStartDate() != null && r.getStartDate().isAfter(now))
                .sorted(Comparator.comparing(Reservation::getStartDate))
                .limit(3)
                .toList();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total", mine.size());
        out.put("pending", pending);
        out.put("confirmed", confirmed);
        out.put("cancelled", cancelled);
        out.put("upcoming", upcoming);
        return ResponseEntity.ok(out);
    }

    // ── Mutations ─────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Reservation reservation,
                                    @AuthenticationPrincipal Jwt jwt,
                                    @RequestParam(required = false) String keycloakUserId) {
        try {
            if (reservation.getPlace() == null || reservation.getPlace().getId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "place.id required"));
            }
            Integer placeId = reservation.getPlace().getId();
            Place place = placeRepository.findById(placeId)
                    .orElseThrow(() -> new RuntimeException("Place not found"));

            // Authoritative owner = JWT subject when present; fall back to the
            // legacy query param so the existing front keeps working until it's
            // updated to omit it.
            String owner = (jwt != null) ? jwt.getSubject() : keycloakUserId;
            if (owner == null || owner.isBlank()) {
                return ResponseEntity.status(401).body(Map.of("message", "authenticated user required"));
            }
            reservation.setKeycloakUserId(owner);
            reservation.setPlace(place);
            reservation.setReservationDate(LocalDateTime.now());
            if (reservation.getStatus() == null) {
                reservation.setStatus(Reservation.Status.PENDING);
            }
            return ResponseEntity.ok(reservationRepository.save(reservation));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id,
                                    @RequestBody Reservation data,
                                    @AuthenticationPrincipal Jwt jwt) {
        Reservation reservation = reservationRepository.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin(jwt);
        boolean owner = ownsReservation(jwt, reservation);
        if (!admin && !owner) return ResponseEntity.status(403).build();

        // Non-admins may only modify PENDING reservations and may not flip the
        // status themselves.
        if (!admin && reservation.getStatus() != Reservation.Status.PENDING) {
            return ResponseEntity.status(409).body(Map.of(
                    "message",
                    "Réservation non modifiable (statut " + reservation.getStatus() + ")."));
        }

        if (data.getStartDate() != null)       reservation.setStartDate(data.getStartDate());
        if (data.getEndDate() != null)         reservation.setEndDate(data.getEndDate());
        if (data.getNumberOfPeople() != null)  reservation.setNumberOfPeople(data.getNumberOfPeople());
        if (data.getSpecialRequests() != null) reservation.setSpecialRequests(data.getSpecialRequests());
        if (admin && data.getStatus() != null) reservation.setStatus(data.getStatus());

        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Integer id,
                                    @AuthenticationPrincipal Jwt jwt) {
        Reservation reservation = reservationRepository.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();

        boolean admin = isAdmin(jwt);
        boolean owner = ownsReservation(jwt, reservation);
        if (!admin && !owner) return ResponseEntity.status(403).build();

        if (reservation.getStatus() == Reservation.Status.CANCELLED) {
            return ResponseEntity.ok(reservation);
        }
        // Non-admins can only cancel while PENDING.
        if (!admin && reservation.getStatus() != Reservation.Status.PENDING) {
            return ResponseEntity.status(409).body(Map.of(
                    "message",
                    "Réservation non annulable (statut " + reservation.getStatus() + ")."));
        }

        reservation.setStatus(Reservation.Status.CANCELLED);
        return ResponseEntity.ok(reservationRepository.save(reservation));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        reservationRepository.deleteById(id);
    }

    // ── PDF receipt (owner or admin) ───────────────────────────────────────
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Integer id,
                                              @AuthenticationPrincipal Jwt jwt) {
        Reservation reservation = reservationRepository.findById(id).orElse(null);
        if (reservation == null) return ResponseEntity.notFound().build();
        if (!isAdmin(jwt) && !ownsReservation(jwt, reservation)) {
            return ResponseEntity.status(403).build();
        }

        byte[] pdfContent = pdfService.generateReservationPdf(reservation);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "reservation-" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdfContent);
    }

    // ── Public availability lookups (used by reservation form) ─────────────
    @GetMapping("/occupied-dates/{placeId}")
    public List<Map<String, String>> getOccupiedDates(@PathVariable Integer placeId) {
        List<Reservation> reservations = reservationRepository.findAll();
        List<Map<String, String>> result = new ArrayList<>();
        for (Reservation r : reservations) {
            if (r.getPlace() == null || !r.getPlace().getId().equals(placeId)) continue;
            if (r.getStatus() == Reservation.Status.CANCELLED) continue;
            if (r.getStartDate() == null || r.getEndDate() == null) continue;
            Map<String, String> map = new HashMap<>();
            map.put("startDate", r.getStartDate().toLocalDate().toString());
            map.put("endDate", r.getEndDate().toLocalDate().toString());
            result.add(map);
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    private boolean isAdmin(Jwt jwt) {
        if (jwt == null) return false;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess == null) return false;
            @SuppressWarnings("unchecked")
            Map<String, Object> client = (Map<String, Object>) resourceAccess.get("tuneoproject");
            if (client == null) return false;
            @SuppressWarnings("unchecked")
            List<String> roles = (List<String>) client.get("roles");
            return roles != null && roles.contains("role_admin");
        } catch (Exception e) {
            return false;
        }
    }

    private boolean ownsReservation(Jwt jwt, Reservation r) {
        if (jwt == null || r == null) return false;
        String sub = jwt.getSubject();
        return sub != null && sub.equals(r.getKeycloakUserId());
    }

    // Suppress unused warnings; helpers kept for future date-range filtering on /me.
    @SuppressWarnings("unused")
    private static LocalDate today() {
        return LocalDate.now();
    }
}
