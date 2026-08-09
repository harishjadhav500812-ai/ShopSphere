package com.shopsphere.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.shopsphere.security.JwtProperties;
import com.shopsphere.security.JwtService;
import com.shopsphere.user.domain.Role;
import com.shopsphere.user.dto.RegisterUserRequest;
import com.shopsphere.user.dto.UserResponse;
import com.shopsphere.user.service.UserService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private SecretKey jwtSecretKey;

    @Autowired
    private JwtProperties jwtProperties;

    private UserResponse registeredUser;
    private String registeredPassword = "secret-pass";

    @BeforeEach
    void setUp() {
        String email = "auth.user." + UUID.randomUUID() + "@shopsphere.test";
        registeredUser = userService.register(new RegisterUserRequest(
                email,
                registeredPassword,
                "Auth User",
                Role.CUSTOMER
        )).user();
    }

    @Test
    void loginSucceedsWithValidCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(registeredUser.email(), registeredPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(3600))
                .andExpect(jsonPath("$.user.id").value(registeredUser.id()))
                .andExpect(jsonPath("$.user.email").value(registeredUser.email()))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void loginFailsWithInvalidCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "wrong-password"
                                }
                                """.formatted(registeredUser.email())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void registrationRemainsPublic() throws Exception {
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "public.register.%s@shopsphere.test",
                                  "password": "secret-pass",
                                  "fullName": "Public Register",
                                  "role": "SELLER"
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("SELLER"));
    }

    @Test
    void getUserRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/users/{id}", registeredUser.id()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void getUserSucceedsWithValidJwt() throws Exception {
        String token = loginAndGetToken(registeredUser.email(), registeredPassword);

        mockMvc.perform(get("/api/users/{id}", registeredUser.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(registeredUser.id()))
                .andExpect(jsonPath("$.email").value(registeredUser.email()));
    }

    @Test
    void getUserFailsWithInvalidJwt() throws Exception {
        mockMvc.perform(get("/api/users/{id}", registeredUser.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-valid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void getUserFailsWithExpiredJwt() throws Exception {
        String expiredToken = createExpiredToken(
                registeredUser.email(),
                registeredUser.id(),
                Role.CUSTOMER.name()
        );

        mockMvc.perform(get("/api/users/{id}", registeredUser.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void getUserForbiddenWhenRoleIsNotAllowed() throws Exception {
        String guestToken = jwtService.createAccessToken(
                registeredUser.email(),
                registeredUser.id(),
                "GUEST",
                60
        );

        mockMvc.perform(get("/api/users/{id}", registeredUser.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + guestToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    void issuedJwtContainsExpectedClaims() throws Exception {
        String token = loginAndGetToken(registeredUser.email(), registeredPassword);
        var jwt = jwtDecoder.decode(token);

        assertThat(jwt.getSubject()).isEqualTo(registeredUser.email());
        assertThat(jwt.getIssuer().toString()).isEqualTo(jwtProperties.issuer());
        assertThat(jwt.getIssuedAt()).isNotNull();
        assertThat(jwt.getExpiresAt()).isAfter(Instant.now());
        assertThat(jwt.getClaimAsString("role")).isEqualTo("CUSTOMER");
        assertThat(((Number) jwt.getClaim("userId")).longValue()).isEqualTo(registeredUser.id());
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "%s"
                                }
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("accessToken").asText();
    }

    private String createExpiredToken(String email, Long userId, String role) throws Exception {
        Instant issuedAt = Instant.now().minus(2, ChronoUnit.HOURS);
        Instant expiresAt = Instant.now().minus(1, ChronoUnit.HOURS);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(jwtProperties.issuer())
                .subject(email)
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .claim("userId", userId)
                .claim("role", role)
                .build();

        SignedJWT signedJwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        signedJwt.sign(new MACSigner(jwtSecretKey));
        return signedJwt.serialize();
    }
}
