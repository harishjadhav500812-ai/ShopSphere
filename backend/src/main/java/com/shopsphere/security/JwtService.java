package com.shopsphere.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;

public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public JwtService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    public String createAccessToken(User user) {
        return createAccessToken(
                user.getEmail(),
                user.getId(),
                user.getRole().name(),
                jwtProperties.expirationMinutes()
        );
    }

    public String createAccessToken(String email, Long userId, Role role, long expirationMinutes) {
        return createAccessToken(email, userId, role.name(), expirationMinutes);
    }

    public String createAccessToken(String email, Long userId, String role, long expirationMinutes) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(expirationMinutes, ChronoUnit.MINUTES);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.issuer())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(email)
                .claim("userId", userId)
                .claim("role", role)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expiresInSeconds() {
        return jwtProperties.expirationMinutes() * 60;
    }
}
