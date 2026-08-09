package com.shopsphere.verification.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Generates cryptographically secure, single-use email verification tokens.
 *
 * The raw token (256 bits of entropy, URL-safe) is only ever held in memory long enough
 * to email it to the user and is never persisted or logged. Only its SHA-256 hash is
 * stored, so a database leak alone cannot be used to forge a valid verification link.
 */
public final class VerificationTokenGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    private VerificationTokenGenerator() {
    }

    /** A fresh, unguessable, URL-safe raw token (not persisted anywhere \u2014 email it, then discard). */
    public static String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** One-way SHA-256 hash of a raw token, safe to store and compare against. */
    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }
}
