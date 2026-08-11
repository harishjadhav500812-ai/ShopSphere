package com.shopsphere.auth;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.auth.domain.PasswordResetToken;
import com.shopsphere.auth.repository.PasswordResetTokenRepository;
import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        resetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User("reset.user@shopsphere.test", passwordEncoder.encode("OldPassword123!"), "Reset Tester", Role.CUSTOMER);
        user.markEmailVerified();
        testUser = userRepository.save(user);
    }

    @Test
    void shouldRequestPasswordResetSuccessfully() throws Exception {
        String json = """
                {
                  "email": "%s"
                }
                """.formatted(testUser.getEmail());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testUser.getEmail().toLowerCase()))
                .andExpect(jsonPath("$.devResetCode", notNullValue()));
    }

    @Test
    void shouldResetPasswordAndAllowLoginWithNewPassword() throws Exception {
        // Step 1: Forgot Password Request
        String forgotJson = """
                {
                  "email": "%s"
                }
                """.formatted(testUser.getEmail());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forgotJson))
                .andExpect(status().isOk());

        PasswordResetToken token = resetTokenRepository.findAll().get(0);

        // Step 2: Reset Password Request
        String resetJson = """
                {
                  "email": "%s",
                  "code": "%s",
                  "newPassword": "BrandNewPass123!"
                }
                """.formatted(testUser.getEmail(), token.getCode());

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("reset successfully")));

        // Step 3: Verify Login with New Password
        String loginJson = """
                {
                  "email": "%s",
                  "password": "BrandNewPass123!"
                }
                """.formatted(testUser.getEmail());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()));
    }
}
