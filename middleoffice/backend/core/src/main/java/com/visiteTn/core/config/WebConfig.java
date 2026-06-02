package com.visiteTn.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Placeholder WebMvc configuration. CORS is configured in {@link SecurityConfig}
 * via the {@code corsConfigurationSource()} bean — do not add a second CORS
 * configuration here or the two will fight (the previous overlapping
 * configuration used a malformed origin string).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
