package com.shopsphere.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.shopsphere.security.JwtProperties;
import com.shopsphere.security.JwtService;
import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.dto.RegisterUserRequest;
import com.shopsphere.user.dto.UserResponse;
import com.shopsphere.user.repository.UserRepository;
import com.shopsphere.user.service.UserService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAuthorizationRolesTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private JwtProperties jwtProperties;

    @Test
    void customerTokenCanAccessProtectedUserEndpoint() throws Exception {
        UserResponse customer = register(Role.CUSTOMER);
        String token = loginAndGetToken(customer.email(), "secret-pass");

        mockMvc.perform(get("/api/users/{id}", customer.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void sellerTokenCanAccessProtectedUserEndpoint() throws Exception {
        UserResponse seller = register(Role.SELLER);
        String token = loginAndGetToken(seller.email(), "secret-pass");

        mockMvc.perform(get("/api/users/{id}", seller.id())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("SELLER"));
    }

    @Test
    void adminTokenCanAccessProtectedUserEndpoint() throws Exception {
        User admin = persistAdmin();
        String token = loginAndGetToken(admin.getEmail(), "secret-pass");

        mockMvc.perform(get("/api/users/{id}", admin.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void loginRoleClaimComesFromPersistedUserNotRequestBody() throws Exception {
        UserResponse customer = register(Role.CUSTOMER);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "secret-pass",
                                  "role": "ADMIN"
                                }
                                """.formatted(customer.email())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        Jwt jwt = jwtDecoder.decode(body.get("accessToken").asText());

        assertThat(jwt.getSubject()).isEqualTo(customer.email());
        assertThat(jwt.getIssuer().toString()).isEqualTo(jwtProperties.issuer());
        assertThat(jwt.getExpiresAt()).isAfter(Instant.now());
        assertThat(jwt.getClaimAsString("role")).isEqualTo("CUSTOMER");
    }

    @Test
    void registrationRejectsAdminViaHttp() throws Exception {
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin.%s@shopsphere.test",
                                  "password": "secret-pass",
                                  "fullName": "Nope Admin",
                                  "role": "ADMIN"
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("ADMIN registration is not allowed through this endpoint"));
    }

    @Test
    void loginNeverReturnsPasswordFields() throws Exception {
        UserResponse customer = register(Role.CUSTOMER);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "secret-pass"
                                }
                                """.formatted(customer.email())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void issuedTokenUsesConfiguredIssuerAndExpiration() throws Exception {
        UserResponse customer = register(Role.CUSTOMER);
        String token = loginAndGetToken(customer.email(), "secret-pass");
        Jwt jwt = jwtDecoder.decode(token);

        assertThat(jwt.getIssuer().toString()).isEqualTo(jwtProperties.issuer());
        assertThat(jwt.getIssuedAt()).isNotNull();
        assertThat(jwt.getExpiresAt()).isAfter(jwt.getIssuedAt());
        assertThat(jwt.getSubject()).isEqualTo(customer.email());
        assertThat(jwt.getClaimAsString("role")).isEqualTo(customer.role().name());
    }

    private UserResponse register(Role role) {
        return userService.register(new RegisterUserRequest(
                role.name().toLowerCase() + "." + UUID.randomUUID() + "@shopsphere.test",
                "secret-pass",
                role.name() + " User",
                role
        ));
    }

    private User persistAdmin() {
        User admin = new User(
                "admin." + UUID.randomUUID() + "@shopsphere.test",
                passwordEncoder.encode("secret-pass"),
                "Admin User",
                Role.ADMIN
        );
        return userRepository.save(admin);
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

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken")
                .asText();
    }
}
