package com.shopsphere.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Thin, reusable SMTP email sender. Knows nothing about verification, orders, or any
 * other business domain \u2014 callers pass fully-composed subject/HTML/text content.
 *
 * SMTP transport is configured entirely via environment variables (see application.properties:
 * MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM). No credentials ever appear
 * in source code. When no SMTP host is configured (e.g. local dev), sending is skipped and
 * {@code false} is returned so callers can degrade gracefully instead of lying about delivery.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Environment environment;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider, Environment environment) {
        this.mailSenderProvider = mailSenderProvider;
        this.environment = environment;
    }

    public boolean isConfigured() {
        String host = environment.getProperty("spring.mail.host");
        return host != null && !host.isBlank() && mailSenderProvider.getIfAvailable() != null;
    }

    /**
     * Sends a multipart HTML email with a plain-text fallback. Never throws \u2014 returns whether
     * the send actually succeeded so callers never have to (and never accidentally do) report
     * successful delivery when SMTP failed.
     */
    public boolean sendHtmlEmail(String to, String subject, String htmlBody, String textFallback) {
        if (!isConfigured()) {
            log.info("SMTP not configured (set MAIL_HOST); skipping email delivery to {}", to);
            return false;
        }

        try {
            JavaMailSender sender = mailSenderProvider.getObject();
            MimeMessage mimeMessage = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textFallback, htmlBody);

            String from = resolveFromAddress();
            if (from != null) {
                helper.setFrom(from);
            }

            sender.send(mimeMessage);
            log.info("Email sent successfully to {}", to);
            return true;
        } catch (Exception ex) {
            // Intentionally logs only the failure reason, never any token/credential/content.
            log.error("Failed to send email to {}: {}", to, ex.getMessage());
            return false;
        }
    }

    private String resolveFromAddress() {
        String from = environment.getProperty("MAIL_FROM");
        if (from == null || from.isBlank()) {
            // Most SMTP providers require the From address to match (or be verified against) the account.
            from = environment.getProperty("spring.mail.username");
        }
        return (from == null || from.isBlank()) ? null : from;
    }
}
