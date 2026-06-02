package com.visiteTn.core.Repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.visiteTn.core.entities.User;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    Optional<User> findByKeycloakId(String keycloakId);
    Boolean existsByEmail(String email);
    Optional<User> findByEmailAndRole(String email, User.Role role);
}
