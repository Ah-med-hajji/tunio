package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.HistoryRepository;
import com.visiteTn.core.Repositories.UserRepository;
import com.visiteTn.core.entities.History;
import com.visiteTn.core.entities.User;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin("*")
public class HistoryController {

    private final HistoryRepository historyRepository;
    private final UserRepository userRepository;

    public HistoryController(HistoryRepository historyRepository,
                             UserRepository userRepository) {
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<History> getAllHistory() {
        return historyRepository.findAll();
    }

    @GetMapping("/{id}")
    public History getById(@PathVariable Integer id) {
        return historyRepository.findById(id).orElse(null);
    }

    @PostMapping
    public History create(@RequestBody History history) {
        User user = userRepository.findById(history.getUser().getId()).orElse(null);
        if (user == null) return null;

        history.setUser(user);
        return historyRepository.save(history);
    }

    @PutMapping("/{id}")
    public History update(@PathVariable Integer id, @RequestBody History data) {
        History history = historyRepository.findById(id).orElse(null);
        if (history == null) return null;

        history.setQuery(data.getQuery());
        history.setResultsCount(data.getResultsCount());
        history.setFilters(data.getFilters());

        return historyRepository.save(history);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        historyRepository.deleteById(id);
    }

    // ✅ Get history by user
    @GetMapping("/user/{userId}")
    public List<History> getByUser(@PathVariable Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null ? historyRepository.findByUser(user) : null;
    }
}
