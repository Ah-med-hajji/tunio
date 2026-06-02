package com.visiteTn.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ADMIN = "ROLE_role_admin";
    private static final String PARTNER = "ROLE_role_partner";
    private static final String USER = "ROLE_role_user";

    @Autowired
    private JwtConverter jwtConverter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // ── Public ───────────────────────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/users/register", "/api/users/signin").permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/places",
                                "/api/places/{id:[0-9]+}",
                                "/api/places/search",
                                "/api/places/featured",
                                "/api/places/category/**",
                                "/api/places/*/available-capacity",
                                "/api/places/*/occupied-dates").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories", "/api/categories/**", "/categories", "/categories/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payment/config").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1").permitAll()

                        // ── Authenticated (any logged-in role) ───────────────────
                        .requestMatchers("/api/users/me", "/api/users/me/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reservations/me").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/reservations/{id:[0-9]+}/pdf").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/payment/create-payment-intent").authenticated()

                        // ── role_user / role_partner / role_admin ────────────────
                        .requestMatchers(HttpMethod.POST, "/api/reservations").hasAnyAuthority(USER, PARTNER, ADMIN)
                        .requestMatchers(HttpMethod.PATCH, "/api/reservations/*/cancel").hasAnyAuthority(USER, PARTNER, ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/reservations/{id:[0-9]+}").hasAnyAuthority(USER, PARTNER, ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/history").hasAnyAuthority(USER, PARTNER, ADMIN)

                        // ── role_partner / role_admin ────────────────────────────
                        .requestMatchers(HttpMethod.POST, "/api/demandes").hasAnyAuthority(PARTNER, ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/demandes/mine", "/api/demandes/mine/**").hasAnyAuthority(PARTNER, ADMIN)

                        // ── role_admin ───────────────────────────────────────────
                        .requestMatchers("/api/admin/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/users", "/api/users/{id:[0-9]+}").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/users/{id:[0-9]+}").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/categories", "/categories").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**", "/categories/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**", "/categories/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/places").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/places/{id:[0-9]+}").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/places/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/reservations").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/reservations/place/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/reservations/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/transactions/**").hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/history", "/api/history/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/demandes/**").hasAuthority(ADMIN)

                        // Anything not matched above must be authenticated.
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter))
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:4200"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
