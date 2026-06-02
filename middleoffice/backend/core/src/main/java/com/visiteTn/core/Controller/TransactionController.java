package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.ReservationRepository;
import com.visiteTn.core.Repositories.TransactionRepository;
import com.visiteTn.core.Repositories.UserRepository;
import com.visiteTn.core.entities.Transaction;
import com.visiteTn.core.entities.User;
import com.visiteTn.core.entities.Reservation;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin("*")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;

    public TransactionController(TransactionRepository transactionRepository,
                                 UserRepository userRepository,
                                 ReservationRepository reservationRepository) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @GetMapping("/{id}")
    public Transaction getById(@PathVariable Integer id) {
        return transactionRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Transaction create(@RequestBody Transaction transaction) {
        // Vérification existence user & reservation
        User user = userRepository.findById(transaction.getUser().getId()).orElse(null);
        Reservation reservation = reservationRepository.findById(transaction.getReservation().getId()).orElse(null);

        if (user == null || reservation == null) return null;

        transaction.setUser(user);
        transaction.setReservation(reservation);

        return transactionRepository.save(transaction);
    }

    @PutMapping("/{id}")
    public Transaction update(@PathVariable Integer id, @RequestBody Transaction data) {
        Transaction transaction = transactionRepository.findById(id).orElse(null);
        if (transaction == null) return null;

        transaction.setAmount(data.getAmount());
        transaction.setCurrency(data.getCurrency());
        transaction.setStatus(data.getStatus());
        transaction.setPaymentGateway(data.getPaymentGateway());
        transaction.setTransactionId(data.getTransactionId());

        return transactionRepository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        transactionRepository.deleteById(id);
    }

    // ✅ Get transactions by user
    @GetMapping("/user/{userId}")
    public List<Transaction> getByUser(@PathVariable Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null ? transactionRepository.findByUser(user) : null;
    }

    // ✅ Get transactions by reservation
    @GetMapping("/reservation/{reservationId}")
    public List<Transaction> getByReservation(@PathVariable Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);
        return reservation != null ? transactionRepository.findByReservation(reservation) : null;
    }

    // ✅ Get transactions by status
    @GetMapping("/status/{status}")
    public List<Transaction> getByStatus(@PathVariable Transaction.Status status) {
        return transactionRepository.findByStatus(status);
    }
}
