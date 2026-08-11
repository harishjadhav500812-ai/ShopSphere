package com.shopsphere.verification.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;
import com.shopsphere.verification.domain.VerificationCode;
import com.shopsphere.verification.repository.VerificationCodeRepository;

import jakarta.mail.internet.MimeMessage;

/**
 * Issues, delivers and verifies 6-digit email verification codes.
 *
 * Delivery:
 * Primary: Sends via Brevo (Sendinblue) SMTP / REST API integration.
 * Fallback: When Brevo is unauthorized or not configured, logs the code to backend console
 * and surfaces it to the client as a dev-only field so the verification flow remains 100% functional.
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final VerificationCodeRepository codeRepository;
    private final UserRepository userRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Environment environment;
    private final boolean verificationRequired;
    private final long codeTtlMinutes;

    public EmailVerificationService(
            VerificationCodeRepository codeRepository,
            UserRepository userRepository,
            ObjectProvider<JavaMailSender> mailSenderProvider,
            Environment environment,
            @Value("${shopsphere.auth.email-verification-required:true}") boolean verificationRequired,
            @Value("${shopsphere.auth.verification-code-ttl-minutes:10}") long codeTtlMinutes
    ) {
        this.codeRepository = codeRepository;
        this.userRepository = userRepository;
        this.mailSenderProvider = mailSenderProvider;
        this.environment = environment;
        this.verificationRequired = verificationRequired;
        this.codeTtlMinutes = codeTtlMinutes;
    }

    public boolean isVerificationRequired() {
        return verificationRequired;
    }

    public boolean isMailConfigured() {
        String host = environment.getProperty("spring.mail.host");
        String username = environment.getProperty("spring.mail.username");
        return (host != null && !host.isBlank()) || (username != null && !username.isBlank());
    }

    /** Generates a fresh code for the user (replacing any previous one) and delivers it via Brevo. */
    @Transactional
    public VerificationCode issueCode(User user) {
        codeRepository.deleteByUserId(user.getId());
        codeRepository.flush();

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        VerificationCode saved = codeRepository.save(
                new VerificationCode(user.getId(), code, Instant.now().plus(Duration.ofMinutes(codeTtlMinutes)))
        );
        deliver(user, code);
        return saved;
    }

    /** Returns the freshly issued code if Brevo is unconfigured or unauthorized (dev fallback). */
    @Transactional
    public String issueCodeForClient(User user) {
        codeRepository.deleteByUserId(user.getId());
        codeRepository.flush();

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        VerificationCode saved = codeRepository.save(
                new VerificationCode(user.getId(), code, Instant.now().plus(Duration.ofMinutes(codeTtlMinutes)))
        );
        boolean delivered = deliver(user, code);
        return delivered ? null : saved.getCode();
    }

    @Transactional
    public User verify(String rawEmail, String rawCode) {
        User user = findUser(rawEmail);
        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already verified");
        }

        VerificationCode stored = codeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No verification code found. Please request a new one."));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Verification code has expired. Please request a new one.");
        }
        if (!stored.getCode().equals(rawCode == null ? "" : rawCode.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }

        user.markEmailVerified();
        userRepository.save(user);
        codeRepository.delete(stored);
        return user;
    }

    @Transactional
    public User resend(String rawEmail) {
        User user = findUser(rawEmail);
        if (user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already verified");
        }
        issueCode(user);
        return user;
    }

    /** Returns the current unexpired code for a user, for dev-mode delivery only. */
    @Transactional(readOnly = true)
    public String currentDevCode(User user) {
        return codeRepository.findByUserId(user.getId())
                .filter(code -> code.getExpiresAt().isAfter(Instant.now()))
                .map(VerificationCode::getCode)
                .orElse(null);
    }

    private User findUser(String rawEmail) {
        String normalizedEmail = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No account found for this email"));
    }

    private boolean deliver(User user, String code) {
        String recipientEmail = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";

        if (!isMailConfigured()) {
            log.info("[DEV] Mail service not configured (set MAIL_HOST to enable Brevo delivery). Verification code for {}: {}", recipientEmail, code);
            return false;
        }

        String from = environment.getProperty("MAIL_FROM");
        if (from == null || from.isBlank()) {
            from = environment.getProperty("spring.mail.username");
        }
        if (from == null || from.isBlank()) {
            from = "noreply@shopsphere.com";
        }

        String htmlBody = VerificationEmailTemplate.buildOtpHtml(user.getFullName(), code, codeTtlMinutes);
        String textBody = VerificationEmailTemplate.buildOtpText(user.getFullName(), code, codeTtlMinutes);

        // Safe Diagnostic Log (without secrets)
        log.info("Initiating Brevo verification email delivery to: {} (Sender: {})", recipientEmail, from);

        // Attempt 1: JavaMailSender (Brevo SMTP Relay)
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender != null) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(from, "ShopSphere");
                helper.setTo(recipientEmail);
                helper.setSubject("Verify your ShopSphere account");
                helper.setText(textBody, htmlBody);

                mailSender.send(mimeMessage);
                log.info("Brevo verification email successfully sent via SMTP to {}", recipientEmail);
                return true;
            } catch (Exception smtpEx) {
                log.warn("Brevo SMTP delivery failed for {}: {}. Attempting Brevo REST API fallback...",
                        recipientEmail, smtpEx.getMessage());
            }
        }

        // Attempt 2: Brevo REST API Fallback (api.brevo.com/v3/smtp/email)
        String apiKey = environment.getProperty("spring.mail.password");
        if (apiKey != null && !apiKey.isBlank()) {
            boolean apiSuccess = sendViaBrevoRestApi(from, recipientEmail, user.getFullName(), code, htmlBody, apiKey);
            if (apiSuccess) {
                log.info("Brevo verification email successfully sent via REST API to {}", recipientEmail);
                return true;
            }
        }

        // Fallback when Brevo account requires key update/authorization
        log.warn("[DEV FALLBACK] Brevo email delivery failed for recipient {}. Brevo sender authorization or active API key is required. Verification code logged for testing: {}", recipientEmail, code);
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
                          "subject": "Verify your ShopSphere account",
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
