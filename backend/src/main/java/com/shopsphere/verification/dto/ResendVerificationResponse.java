package com.shopsphere.verification.dto;

/**
 * Response for resend verification request.
 * Contains message and optionally dev verification code for testing.
 */
public record ResendVerificationResponse(
        String message,
        boolean mailConfigured,
        String devVerificationCode
) {
    // Constructor with just message (for backwards compatibility)
    public ResendVerificationResponse(String message) {
        this(message, false, null);
    }
}
