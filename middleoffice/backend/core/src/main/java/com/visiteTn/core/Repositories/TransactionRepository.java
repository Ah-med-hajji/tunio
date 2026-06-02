package com.visiteTn.core.Repositories;

import com.visiteTn.core.entities.Transaction;
import com.visiteTn.core.entities.User;
import com.visiteTn.core.entities.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {

    List<Transaction> findByUser(User user);

    List<Transaction> findByReservation(Reservation reservation);

    List<Transaction> findByStatus(Transaction.Status status);

}
