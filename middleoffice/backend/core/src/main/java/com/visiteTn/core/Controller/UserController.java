package com.visiteTn.core.Controller;

import com.visiteTn.core.Repositories.UserRepository;
import com.visiteTn.core.entities.User;
import com.visiteTn.core.payload.LoginRequest;
import com.visiteTn.core.payload.RegisterRequest;
import com.visiteTn.core.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")

public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            userService.createUser(request);
            return ResponseEntity.ok(Map.of("message", "Inscription réussie")); // ← JSON
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Erreur serveur"));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody LoginRequest request) {
        Map<String, Object> tokenResponse = userService.login(request); // your method
        return ResponseEntity.ok(tokenResponse);
    }

    /**
     * Current user's profile, derived from the JWT principal. Provisions a
     * local mirror row on first access if Keycloak says the user exists but
     * the local table doesn't have them yet.
     */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) return ResponseEntity.status(401).build();
        User user = resolveOrCreateLocalMirror(jwt);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<User> updateCurrentUser(@AuthenticationPrincipal Jwt jwt,
                                                  @RequestBody User patch) {
        if (jwt == null) return ResponseEntity.status(401).build();
        User user = resolveOrCreateLocalMirror(jwt);
        if (patch.getFirstName() != null) user.setFirstName(patch.getFirstName());
        if (patch.getLastName() != null)  user.setLastName(patch.getLastName());
        if (patch.getPhone() != null)     user.setPhone(patch.getPhone());
        if (patch.getAvatarUrl() != null) user.setAvatarUrl(patch.getAvatarUrl());
        return ResponseEntity.ok(userRepository.save(user));
    }

    private User resolveOrCreateLocalMirror(Jwt jwt) {
        String sub = jwt.getSubject();
        Optional<User> existing = userRepository.findByKeycloakId(sub);
        if (existing.isPresent()) return existing.get();

        String email = jwt.getClaimAsString("email");
        if (email != null) {
            Optional<User> byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                User u = byEmail.get();
                u.setKeycloakId(sub);
                return userRepository.save(u);
            }
        }

        User u = new User();
        u.setKeycloakId(sub);
        u.setEmail(email != null ? email : sub + "@keycloak.local");
        u.setFirstName(orDefault(jwt.getClaimAsString("given_name"), ""));
        u.setLastName(orDefault(jwt.getClaimAsString("family_name"), ""));
        u.setPassword("KEYCLOAK_MANAGED");
        u.setRole(deriveRole(jwt));
        return userRepository.save(u);
    }

    @SuppressWarnings("unchecked")
    private User.Role deriveRole(Jwt jwt) {
        try {
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                Map<String, Object> client = (Map<String, Object>) resourceAccess.get("tuneoproject");
                if (client != null) {
                    List<String> roles = (List<String>) client.get("roles");
                    if (roles != null) {
                        if (roles.contains("role_admin"))   return User.Role.ADMIN;
                        if (roles.contains("role_partner")) return User.Role.MERCHANT;
                    }
                }
            }
        } catch (Exception ignored) {}
        return User.Role.USER;
    }

    private String orDefault(String v, String fallback) {
        return (v == null || v.isBlank()) ? fallback : v;
    }

    // GET all users (ADMIN)
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // GET user by id
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT update user
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id,
                                           @RequestBody User userDetails) {
        User updated = userService.updateUser(id, userDetails);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
