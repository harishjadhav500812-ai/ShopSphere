package com.shopsphere.verification.service;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;
import com.shopsphere.verification.domain.VerificationCode;
import com.shopsphere.verification.repository.VerificationCodeRepository;

/**
 * Issues, delivers and verifies 6-digit email verification codes.
 *
 * Delivery: when an SMTP host is configured (MAIL_HOST env var) the code is emailed to the user.
 * When no SMTP host is configured (local dev) the code is logged to the backend console and
 * surfaced to the client as a dev-only field so the verification flow remains usable.
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
        return host != null && !host.isBlank() && mailSenderProvider.getIfAvailable() != null;
    }

    /** Generates a fresh code for the user (replacing any previous one) and delivers it. */
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

    /** Returns the freshly issued code only when no SMTP server is configured (dev fallback). */
    @Transactional
    public String issueCodeForClient(User user) {
        VerificationCode saved = issueCode(user);
        return isMailConfigured() ? null : saved.getCode();
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
        if (isMailConfigured()) {
            return null;
        }
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

    private void deliver(User user, String code) {
        if (!isMailConfigured()) {
            log.info("[DEV] Email service not configured (set MAIL_HOST to enable). "
                    + "Verification code for {}: {}", user.getEmail(), code);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        String from = environment.getProperty("MAIL_FROM");
        if (from == null || from.isBlank()) {
            // Most SMTP providers require the From address to match the authenticated account.
            from = environment.getProperty("spring.mail.username");
        }
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(user.getEmail());
        message.setSubject("Verify your ShopSphere account");
        message.setText("""
                Hi %s,

                Welcome to ShopSphere! Use the verification code below to activate your account:

                    %s

                This code expires in %d minutes. If you did not create a ShopSphere account, you can ignore this email.

                The ShopSphere Team
                """.formatted(user.getFullName(), code, codeTtlMinutes));

        try {
            mailSenderProvider.getObject().send(message);
            log.info("Verification email sent to {}", user.getEmail());
        } catch (RuntimeException ex) {
            log.error("Failed to send verification email to {}: {}", user.getEmail(), ex.getMessage());
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Could not send verification email. Please try again.");
        }
    }
}
