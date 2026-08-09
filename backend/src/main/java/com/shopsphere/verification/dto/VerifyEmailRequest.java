package com.shopsphere.verification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email,
        
        @NotBlank(message = "code is required")
        String code
) {
}