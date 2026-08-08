package com.shopsphere.security;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import com.shopsphere.user.domain.Role;

/**
 * Derives Spring Security authorities only from known persisted role values.
 * Unknown or blank role claims produce no authorities (authorization will fail closed).
 */
final class JwtRoleAuthorityMapper {

    private static final Set<String> ALLOWED_ROLES = Arrays.stream(Role.values())
            .map(Enum::name)
            .collect(Collectors.toUnmodifiableSet());

    private JwtRoleAuthorityMapper() {
    }

    static Collection<GrantedAuthority> mapAuthorities(Jwt jwt) {
        String roleClaim = jwt.getClaimAsString("role");
        if (roleClaim == null || roleClaim.isBlank()) {
            return List.of();
        }

        String normalized = roleClaim.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ROLES.contains(normalized)) {
            return List.of();
        }

        return List.of(new SimpleGrantedAuthority("ROLE_" + normalized));
    }
}
