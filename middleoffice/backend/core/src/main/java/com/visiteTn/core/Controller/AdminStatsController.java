package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.CategorieRepository;
import com.visiteTn.core.Repositories.DemandePlaceRepository;
import com.visiteTn.core.Repositories.PlaceRepository;
import com.visiteTn.core.Repositories.ReservationRepository;
import com.visiteTn.core.Repositories.TransactionRepository;
import com.visiteTn.core.Repositories.UserRepository;
import com.visiteTn.core.entities.DemandePlace;
import com.visiteTn.core.entities.Reservation;
import com.visiteTn.core.entities.Transaction;
import com.visiteTn.core.entities.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {

    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final int RECENT_LIMIT = 10;

    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;
    private final ReservationRepository reservationRepository;
    private final TransactionRepository transactionRepository;
    private final DemandePlaceRepository demandeRepository;
    private final CategorieRepository categorieRepository;

    public AdminStatsController(UserRepository userRepository,
                                PlaceRepository placeRepository,
                                ReservationRepository reservationRepository,
                                TransactionRepository transactionRepository,
                                DemandePlaceRepository demandeRepository,
                                CategorieRepository categorieRepository) {
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
        this.reservationRepository = reservationRepository;
        this.transactionRepository = transactionRepository;
        this.demandeRepository = demandeRepository;
        this.categorieRepository = categorieRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<Reservation> reservations = reservationRepository.findAll();
        List<Transaction> transactions = transactionRepository.findAll();
        List<DemandePlace> demandes = demandeRepository.findAll();
        List<User> users = userRepository.findAll();

        Map<String, Object> out = new LinkedHashMap<>();

        // ── Top-level counts ────────────────────────────────────────────
        out.put("usersCount", users.size());
        out.put("placesCount", placeRepository.count());
        out.put("categoriesCount", categorieRepository.count());
        out.put("reservationsCount", reservations.size());
        out.put("transactionsCount", transactions.size());

        long activePartners = users.stream()
                .filter(u -> u.getRole() == User.Role.MERCHANT)
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .count();
        out.put("activePartners", activePartners);

        long pendingDemandes = demandes.stream()
                .filter(d -> d.getStatut() == DemandePlace.StatutDemande.PENDING)
                .count();
        out.put("pendingDemandes", pendingDemandes);

        // ── Revenue (TND) — sum of SUCCESS transactions in TND ──────────
        BigDecimal revenueTnd = transactions.stream()
                .filter(t -> t.getStatus() == Transaction.Status.SUCCESS)
                .filter(t -> t.getAmount() != null)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        out.put("revenueTnd", revenueTnd);

        // ── Reservation status breakdown ────────────────────────────────
        EnumMap<Reservation.Status, Long> statusBreakdown = new EnumMap<>(Reservation.Status.class);
        for (Reservation.Status s : Reservation.Status.values()) statusBreakdown.put(s, 0L);
        for (Reservation r : reservations) {
            statusBreakdown.merge(r.getStatus(), 1L, Long::sum);
        }
        out.put("reservationStatusBreakdown", statusBreakdown);

        // ── Monthly reservations (last 12 months) ───────────────────────
        Map<String, Long> reservationsByMonth = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByMonth = new LinkedHashMap<>();
        YearMonth now = YearMonth.now();
        for (int i = 11; i >= 0; i--) {
            YearMonth ym = now.minusMonths(i);
            String key = ym.format(MONTH_KEY);
            reservationsByMonth.put(key, 0L);
            revenueByMonth.put(key, BigDecimal.ZERO);
        }
        for (Reservation r : reservations) {
            if (r.getCreatedAt() == null) continue;
            String key = YearMonth.from(r.getCreatedAt().toLocalDate()).format(MONTH_KEY);
            if (reservationsByMonth.containsKey(key)) {
                reservationsByMonth.merge(key, 1L, Long::sum);
            }
        }
        for (Transaction t : transactions) {
            if (t.getStatus() != Transaction.Status.SUCCESS || t.getAmount() == null || t.getCreatedAt() == null) continue;
            String key = YearMonth.from(t.getCreatedAt().toLocalDate()).format(MONTH_KEY);
            if (revenueByMonth.containsKey(key)) {
                revenueByMonth.merge(key, t.getAmount(), BigDecimal::add);
            }
        }
        out.put("monthlyReservations", toSeries(reservationsByMonth));
        out.put("monthlyRevenue", toSeries(revenueByMonth));

        // ── Recent reservations (10) ────────────────────────────────────
        List<Map<String, Object>> recent = reservations.stream()
                .sorted(Comparator.comparing(
                        Reservation::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(RECENT_LIMIT)
                .map(this::summarize)
                .toList();
        out.put("recentReservations", recent);

        return out;
    }

    private List<Map<String, Object>> toSeries(Map<String, ?> source) {
        List<Map<String, Object>> series = new ArrayList<>(source.size());
        for (Map.Entry<String, ?> e : source.entrySet()) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("month", e.getKey());
            point.put("value", e.getValue());
            series.add(point);
        }
        return series;
    }

    private Map<String, Object> summarize(Reservation r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("status", r.getStatus());
        m.put("createdAt", r.getCreatedAt());
        m.put("startDate", r.getStartDate());
        m.put("endDate", r.getEndDate());
        m.put("numberOfPeople", r.getNumberOfPeople());
        m.put("keycloakUserId", r.getKeycloakUserId());
        m.put("placeId", r.getPlace() != null ? r.getPlace().getId() : null);
        m.put("placeName", r.getPlace() != null ? r.getPlace().getName() : null);
        m.put("placeImageUrl", r.getPlace() != null ? r.getPlace().getImageUrl() : null);
        m.put("stripePaymentId", r.getStripePaymentId());
        return m;
    }
}
