package com.visiteTn.core.Repositories;

import com.visiteTn.core.entities.History;
import com.visiteTn.core.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoryRepository extends JpaRepository<History, Integer> {

    List<History> findByUser(User user);

}
