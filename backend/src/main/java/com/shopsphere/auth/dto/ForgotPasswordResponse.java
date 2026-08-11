package com.shopsphere.auth.dto;

public record ForgotPasswordResponse(
        String email,
        String message,
        String devResetCode
) {
    public ForgotPasswordResponse(String email, String message) {
        this(email, message, null);
    }
}
