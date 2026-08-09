package com.shopsphere.user.dto;

public record RegisterResponse(
        UserResponse user,
        boolean verificationRequired,
        boolean mailConfigured,
        String devVerificationCode
) {
}
