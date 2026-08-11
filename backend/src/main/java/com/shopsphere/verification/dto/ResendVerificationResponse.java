package com.shopsphere.verification.dto;

/**
 * Response for resend verification request.
 * Contains user email and optionally dev verification code for testing.
 */
public record ResendVerificationResponse(
        String email,
        boolean mailConfigured,
        String devVerificationCode
) {
    public ResendVerificationResponse(String email) {
        this(email, false, null);
    }
}
