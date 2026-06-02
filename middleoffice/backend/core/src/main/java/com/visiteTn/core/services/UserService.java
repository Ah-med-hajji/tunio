package com.visiteTn.core.services;

import com.visiteTn.core.Repositories.UserRepository;
import com.visiteTn.core.entities.User;
import com.visiteTn.core.payload.LoginRequest;
import com.visiteTn.core.payload.RegisterRequest;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.CreatedResponseUtil;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;


import com.visiteTn.core.entities.User.Role;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final Keycloak keycloak;

    @Value("${keycloak.realm:TUNEO}")
    private String realm;

    @Value("${keycloak.server-url:http://localhost:9090}")
    private String keycloakServerUrl;

    @Value("${jwt.auth.converter.resource-id:tuneoproject}")
    private String keycloakClientId;

    // 🔹 Créer un utilisateur
    public void createUser(RegisterRequest request) {
        try {
            log.info("📝 Création utilisateur : {}", request.getUsernameOrEmail());

            // Validation
            if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().isEmpty()) {
                throw new IllegalArgumentException("Email/username requis");
            }
            if (request.getPassword() == null || request.getPassword().length() < 6) {
                throw new IllegalArgumentException("Mot de passe minimum 6 caractères");
            }

            // 🔹 Créer l'utilisateur dans Keycloak
            UserRepresentation user = new UserRepresentation();
            user.setUsername(request.getUsernameOrEmail());
            user.setEmail(request.getUsernameOrEmail());
            user.setFirstName(request.getFirstName() != null ? request.getFirstName() : "");
            user.setLastName(request.getLastName() != null ? request.getLastName() : "");
            user.setEnabled(true);
            user.setEmailVerified(false);


            Response response = keycloak.realm(realm)
                    .users()
                    .create(user);

            int status = response.getStatus();
            log.info("✅ Réponse Keycloak : {}", status);

            if (status == 409) {
                throw new RuntimeException("Email déjà utilisé");
            }

            if (status != 201) {
                String errorBody = response.readEntity(String.class);
                log.error("❌ Erreur Keycloak: {}", errorBody);
                throw new RuntimeException("Erreur Keycloak (" + status + "): " + errorBody);
            }

            String userId = CreatedResponseUtil.getCreatedId(response);
            response.close();
            log.info("✅ Utilisateur créé : ID = {}", userId);

            // 🔹 Définir le mot de passe
            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setTemporary(false);
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setValue(request.getPassword());

            keycloak.realm(realm)
                    .users()
                    .get(userId)
                    .resetPassword(credential);
            log.info("✅ Mot de passe défini");

            // 🔹 Assigner le rôle
            String roleName = (request.getRole() != null &&
                    request.getRole().equalsIgnoreCase("partner"))
                    ? "role_partner"
                    : "role_user";

            try {
                RoleRepresentation role = keycloak.realm(realm)
                        .roles()
                        .get(roleName)
                        .toRepresentation();

                keycloak.realm(realm)
                        .users()
                        .get(userId)
                        .roles()
                        .realmLevel()
                        .add(List.of(role));

                log.info("✅ Rôle assigné : {}", roleName);
            } catch (Exception e) {
                log.warn("⚠️ Impossible d'assigner le rôle {}: {}", roleName, e.getMessage());
            }

            // ✅ Sauvegarder dans la DB locale
            User dbUser = new User();
            dbUser.setEmail(request.getUsernameOrEmail());
            dbUser.setFirstName(request.getFirstName());
            dbUser.setLastName(request.getLastName());
            dbUser.setKeycloakId(userId);
            dbUser.setPassword("KEYCLOAK_MANAGED");

// Déterminer le rôle
            Role userRole = (request.getRole() != null &&
                    request.getRole().equalsIgnoreCase("partner"))
                    ? Role.MERCHANT
                    : Role.USER;
            dbUser.setRole(userRole);

            userRepository.save(dbUser);

        } catch (Exception e) {
            log.error("❌ Erreur inscription", e);
            throw new RuntimeException("Inscription échouée : " + e.getMessage(), e);
        }
    }

    // 🔹 Login utilisateur
    public Map<String, Object> login(LoginRequest request) {
        try {
            log.info("🔐 Tentative de connexion : {}", request.getUsername());

            RestTemplate restTemplate = new RestTemplate();
            String url = keycloakServerUrl + "/realms/" + realm + "/protocol/openid-connect/token";

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "password");
            body.add("client_id", keycloakClientId);
            body.add("username", request.getUsername());
            body.add("password", request.getPassword());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> requestEntity =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, requestEntity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Connexion réussie");
                return response.getBody();
            } else {
                throw new RuntimeException("Connexion échouée");
            }
        } catch (Exception e) {
            log.error("❌ Erreur connexion", e);
            throw new RuntimeException("Connexion échouée : " + e.getMessage());
        }
    }

    // 🔹 Récupérer tous les utilisateurs
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // 🔹 Récupérer un utilisateur par id
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    // 🔹 Mettre à jour un utilisateur
    public User updateUser(Integer id, User userDetails) {
        Optional<User> optUser = userRepository.findById(id);
        if (optUser.isPresent()) {
            User user = optUser.get();
            user.setFirstName(userDetails.getFirstName());
            user.setLastName(userDetails.getLastName());
            user.setEmail(userDetails.getEmail());
            user.setPhone(userDetails.getPhone());
            user.setIsActive(userDetails.getIsActive());
            return userRepository.save(user);
        }
        return null;
    }

    // 🔹 Supprimer un utilisateur
    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
    }

    // 🔹 Rechercher par email
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
