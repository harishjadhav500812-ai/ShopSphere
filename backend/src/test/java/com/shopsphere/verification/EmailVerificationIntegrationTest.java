package com.shopsphere.verification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.user.domain.Role;
import com.shopsphere.user.dto.RegisterResponse;
import com.shopsphere.user.dto.RegisterUserRequest;
import com.shopsphere.user.service.UserService;
import com.shopsphere.verification.repository.VerificationCodeRepository;

@SpringBootTest(properties = "shopsphere.auth.email-verification-required=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmailVerificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserService userService;

    @Autowired
    private VerificationCodeRepository codeRepository;

    @Test
    void loginIsBlockedUntilEmailIsVerified() throws Exception {
        String email = "verify." + UUID.randomUUID() + "@shopsphere.test";
        String password = "secret-pass";

        RegisterResponse registered = userService.register(
                new RegisterUserRequest(email, password, "Verify User", Role.CUSTOMER));

        assertThat(registered.verificationRequired()).isTrue();
        // No SMTP server configured in tests, so the dev fallback code must be surfaced.
        assertThat(registered.mailConfigured()).isFalse();
        assertThat(registered.devVerificationCode()).matches("\\d{6}");

        String loginBody = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, password);

        // Unverified account cannot log in
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.startsWith("EMAIL_NOT_VERIFIED")));

        // Wrong code is rejected
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "code": "000000"
                                }
                                """.formatted(email)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid verification code"));

        // Correct code verifies the account
        mockMvc.perform(post("/api/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "code": "%s"
                                }
                                """.formatted(email, registered.devVerificationCode())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        // Code is consumed after successful verification
        assertThat(codeRepository.findByUserId(registered.user().id())).isEmpty();

        // Verified account can log in
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void resendIssuesANewCodeForUnverifiedAccounts() throws Exception {
        String email = "resend." + UUID.randomUUID() + "@shopsphere.test";
        userService.register(new RegisterUserRequest(email, "secret-pass", "Resend User", Role.CUSTOMER));

        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.mailConfigured").value(false))
                .andExpect(jsonPath("$.devVerificationCode").value(
                        org.hamcrest.Matchers.matchesPattern("\\d{6}")));
    }

    @Test
    void resendRejectsUnknownEmail() throws Exception {
        mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "missing.%s@shopsphere.test"
                                }
                                """.formatted(UUID.randomUUID())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("No account found for this email"));
    }
}
