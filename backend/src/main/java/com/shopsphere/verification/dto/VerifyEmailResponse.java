package com.shopsphere.verification.dto;

public record VerifyEmailResponse(
        String email,
        String message
) {
}
