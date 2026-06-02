package com.visiteTn.core.config;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import lombok.extern.slf4j.Slf4j;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
@Slf4j
public class JwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter =
            new JwtGrantedAuthoritiesConverter();

    @Value("${jwt.auth.converter.principle-attribute:preferred_username}")
    private String principleAttribute;

    @Value("${jwt.auth.converter.resource-id:tuneoproject}")
    private String resourceId;

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        log.debug("🔐 Conversion JWT pour resource: {}", resourceId);

        // 🔹 Combiner les autorités standards + rôles de la ressource
        Collection<GrantedAuthority> authorities = Stream.concat(
                jwtGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractResourceRoles(jwt).stream()
        ).collect(Collectors.toSet());

        String principal = getPrincipleClaimName(jwt);
        log.debug("✅ JWT converti - Principal: {}, Autorités: {}", principal, authorities);

        return new JwtAuthenticationToken(
                jwt,
                authorities,
                principal
        );
    }

    /**
     * Extraire le nom d'utilisateur du JWT
     */
    private String getPrincipleClaimName(Jwt jwt) {
        String claimName = JwtClaimNames.SUB;  // Par défaut: "sub"

        if (principleAttribute != null && !principleAttribute.isEmpty()) {
            claimName = principleAttribute;  // Utiliser "preferred_username" si configuré
        }

        Object claim = jwt.getClaim(claimName);
        if (claim == null) {
            log.warn("⚠️ Claim '{}' not found in JWT, using 'sub'", claimName);
            return jwt.getSubject();
        }

        return (String) claim;
    }

    /**
     * Extraire les rôles spécifiques à la ressource
     * Structure JWT: resource_access -> {resourceId} -> roles: ["role1", "role2"]
     */
    private Collection<? extends GrantedAuthority> extractResourceRoles(Jwt jwt) {
        try {
            // 🔹 Étape 1: Vérifier si resource_access existe
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess == null) {
                log.debug("ℹ️ Pas de 'resource_access' dans le JWT");
                return Set.of();
            }

            // 🔹 Étape 2: Vérifier si notre resourceId existe dans resource_access
            Object resourceObj = resourceAccess.get(resourceId);
            if (resourceObj == null) {
                log.debug("ℹ️ Resource '{}' not found in resource_access", resourceId);
                return Set.of();
            }

            // 🔹 Étape 3: Extraire les rôles
            Map<String, Object> resource = (Map<String, Object>) resourceObj;
            Object rolesObj = resource.get("roles");

            if (rolesObj == null) {
                log.debug("ℹ️ Pas de 'roles' pour la resource '{}'", resourceId);
                return Set.of();
            }

            Collection<String> resourceRoles = (Collection<String>) rolesObj;

            // Convert to GrantedAuthority with ROLE_ prefix; keep the Keycloak role
            // string verbatim (don't upper-case) so authorities match
            // hasAuthority("ROLE_role_admin") in @PreAuthorize and SecurityConfig.
            Set<GrantedAuthority> roles = resourceRoles
                    .stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toSet());

            log.debug("✅ Rôles extraits pour '{}': {}", resourceId, roles);
            return roles;

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'extraction des rôles", e);
            return Set.of();
        }
    }
}
