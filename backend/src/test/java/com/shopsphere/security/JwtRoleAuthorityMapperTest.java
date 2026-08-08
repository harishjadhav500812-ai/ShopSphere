package com.shopsphere.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Collection;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtRoleAuthorityMapperTest {

    @Test
    void mapsKnownRolesToAuthorities() {
        assertThat(authoritiesFor("CUSTOMER")).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_CUSTOMER");
        assertThat(authoritiesFor("SELLER")).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_SELLER");
        assertThat(authoritiesFor("ADMIN")).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_ADMIN");
        assertThat(authoritiesFor("customer")).extracting(GrantedAuthority::getAuthority)
                .containsExactly("ROLE_CUSTOMER");
    }

    @Test
    void rejectsUnknownOrBlankRoles() {
        assertThat(authoritiesFor("GUEST")).isEmpty();
        assertThat(authoritiesFor("")).isEmpty();
        assertThat(authoritiesFor(" ROLE_ADMIN ")).isEmpty();
        assertThat(authoritiesFor(null)).isEmpty();
    }

    private Collection<GrantedAuthority> authoritiesFor(String role) {
        Instant now = Instant.now();
        Jwt.Builder builder = Jwt.withTokenValue("token")
                .header("alg", "HS256")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(60))
                .subject("user@shopsphere.test");
        if (role != null) {
            builder.claim("role", role);
        }
        return JwtRoleAuthorityMapper.mapAuthorities(builder.build());
    }
}
