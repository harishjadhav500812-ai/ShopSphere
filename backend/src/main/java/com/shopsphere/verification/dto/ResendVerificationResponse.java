package com.shopsphere.verification.dto;

public record ResendVerificationResponse(
        String email,
        boolean mailConfigured,
        String devVerificationCode
) {
}
