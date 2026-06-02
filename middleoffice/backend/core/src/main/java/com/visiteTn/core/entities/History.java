package com.visiteTn.core.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "history")
public class History {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Relation avec User
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(length = 255, nullable = false)
    private String query;

    @Column(name = "results_count", nullable = false)
    private Integer resultsCount = 0;

    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(columnDefinition = "JSON")
    private String filters;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    public History() {}

    // Getters & Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public Integer getResultsCount() { return resultsCount; }
    public void setResultsCount(Integer resultsCount) { this.resultsCount = resultsCount; }

    public LocalDateTime getTimestamp() { return timestamp; }

    public String getFilters() { return filters; }
    public void setFilters(String filters) { this.filters = filters; }
}
