package com.shopsphere.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "shopsphere.security.cors")
public record CorsProperties(String allowedOrigins) {

    /**
     * @return configured origins, or empty when CORS should stay disabled
     */
    public List<String> resolvedOrigins() {
        if (!StringUtils.hasText(allowedOrigins)) {
            return List.of();
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }

    public boolean isEnabled() {
        return !resolvedOrigins().isEmpty();
    }
}
