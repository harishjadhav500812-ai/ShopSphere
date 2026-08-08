package com.shopsphere.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shopsphere.security.jwt")
public record JwtProperties(
        String secret,
        String issuer,
        long expirationMinutes
) {
}
