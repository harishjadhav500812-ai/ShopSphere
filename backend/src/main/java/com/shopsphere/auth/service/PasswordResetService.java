package com.shopsphere.auth.service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.auth.domain.PasswordResetToken;
import com.shopsphere.auth.dto.ForgotPasswordRequest;
import com.shopsphere.auth.dto.ForgotPasswordResponse;
import com.shopsphere.auth.dto.ResetPasswordRequest;
import com.shopsphere.auth.dto.ResetPasswordResponse;
import com.shopsphere.auth.repository.PasswordResetTokenRepository;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;
import com.shopsphere.verification.service.EmailVerificationService;
import com.shopsphere.verification.service.VerificationEmailTemplate;

import jakarta.mail.internet.MimeMessage;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Environment environment;
    private final EmailVerificationService emailVerificationService;

    @Value("${shopsphere.auth.password-reset-code-ttl-minutes:15}")
    private long resetCodeTtlMinutes;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository resetTokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            Environment environment,
            EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSenderProvider = mailSenderProvider;
        this.environment = environment;
        this.emailVerificationService = emailVerificationService;
    }

    @Transactional
    public ForgotPasswordResponse requestPasswordReset(ForgotPasswordRequest request) {
        String normalizedEmail = request.email() == null ? "" : request.email().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found with this email address"));

        resetTokenRepository.deleteByUserId(user.getId());
        resetTokenRepository.flush();

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        PasswordResetToken savedToken = resetTokenRepository.save(
                new PasswordResetToken(user.getId(), code, Instant.now().plus(Duration.ofMinutes(resetCodeTtlMinutes)))
        );

        boolean delivered = deliverResetEmail(user, code);
        String devResetCode = delivered ? null : savedToken.getCode();

        String msg = delivered
                ? "Password reset code sent to your email address."
                : "Password reset code generated. Check your email or use dev mode code.";

        return new ForgotPasswordResponse(normalizedEmail, msg, devResetCode);
    }

    @Transactional
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.email() == null ? "" : request.email().trim().toLowerCase();
        String rawCode = request.code() == null ? "" : request.code().trim();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account found for this email"));

        PasswordResetToken token = resetTokenRepository.findByUserIdAndCodeAndUsedFalse(user.getId(), rawCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid password reset code"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password reset code has expired. Please request a new one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        token.markUsed();
        resetTokenRepository.save(token);

        log.info("Password successfully reset for user: {}", normalizedEmail);
        return new ResetPasswordResponse("Password has been reset successfully. You can now sign in with your new password.");
    }

    private boolean deliverResetEmail(User user, String code) {
        String recipientEmail = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";

        if (!emailVerificationService.isMailConfigured()) {
            log.info("[DEV] Mail service not configured. Password reset code for {}: {}", recipientEmail, code);
            return false;
        }

        String from = environment.getProperty("MAIL_FROM");
        if (from == null || from.isBlank()) {
            from = environment.getProperty("spring.mail.username");
        }
        if (from == null || from.isBlank()) {
            from = "noreply@shopsphere.com";
        }

        String htmlBody = VerificationEmailTemplate.buildPasswordResetHtml(user.getFullName(), code, resetCodeTtlMinutes);
        String textBody = VerificationEmailTemplate.buildPasswordResetText(user.getFullName(), code, resetCodeTtlMinutes);

        log.info("Initiating Brevo password reset email delivery to: {}", recipientEmail);

        // Attempt 1: JavaMailSender (Brevo SMTP Relay)
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(from, "ShopSphere");
                helper.setTo(recipientEmail);
                helper.setSubject("Reset your ShopSphere password");
                helper.setText(textBody, htmlBody);

                mailSender.send(mimeMessage);
                log.info("Brevo password reset email successfully sent via SMTP to {}", recipientEmail);
                return true;
            } catch (Exception smtpEx) {
                log.warn("Brevo SMTP delivery failed for password reset {}: {}. Attempting Brevo REST API fallback...", recipientEmail, smtpEx.getMessage());
            }
        }

        // Attempt 2: Brevo REST API Fallback
        String apiKey = environment.getProperty("spring.mail.password");
        if (apiKey != null && !apiKey.isBlank()) {
            boolean apiSuccess = sendViaBrevoRestApi(from, recipientEmail, user.getFullName(), code, htmlBody, apiKey);
            if (apiSuccess) {
                log.info("Brevo password reset email successfully sent via REST API to {}", recipientEmail);
                return true;
            }
        }

        log.warn("[DEV FALLBACK] Brevo password reset email delivery failed for recipient {}. Code logged for testing: {}", recipientEmail, code);
        return false;
    }

    private boolean sendViaBrevoRestApi(String senderEmail, String recipientEmail, String recipientName, String code, String htmlContent, String rawApiKey) {
        String[] keyVariants = {
                rawApiKey,
                "xkeysib-" + rawApiKey,
                "xsmtpsib-" + rawApiKey
        };

        for (String apiKey : keyVariants) {
            try {
                URL url = new URL("https://api.brevo.com/v3/smtp/email");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("accept", "application/json");
                conn.setRequestProperty("api-key", apiKey);
                conn.setRequestProperty("content-type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(10000);

                String payload = """
                        {
                          "sender": { "name": "ShopSphere", "email": "%s" },
                          "to": [ { "email": "%s", "name": "%s" } ],
                          "subject": "Reset your ShopSphere password",
                          "htmlContent": %s
                        }
                        """.formatted(
                        escapeJson(senderEmail),
                        escapeJson(recipientEmail),
                        escapeJson(recipientName),
                        toJsonString(htmlContent)
                );

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload.getBytes(StandardCharsets.UTF_8));
                }

                int statusCode = conn.getResponseCode();
                if (statusCode >= 200 && statusCode < 300) {
                    return true;
                }
            } catch (Exception ex) {
                // Ignore key format retry loop failures
            }
        }
        return false;
    }

    private static String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String toJsonString(String input) {
        if (input == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (char c : input.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < ' ') {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        sb.append("\"");
        return sb.toString();
    }
}
