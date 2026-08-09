package com.shopsphere.auth.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.auth.dto.LoginRequest;
import com.shopsphere.auth.dto.LoginResponse;
import com.shopsphere.auth.service.AuthService;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.dto.UserResponse;
import com.shopsphere.verification.dto.ResendVerificationRequest;
import com.shopsphere.verification.dto.ResendVerificationResponse;
import com.shopsphere.verification.dto.VerifyEmailRequest;
import com.shopsphere.verification.service.EmailVerificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService, EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }

    @PostMapping(path = "/login", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping(path = "/verify-email", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public UserResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        User verified = emailVerificationService.verify(request.email(), request.code());
        return new UserResponse(
                verified.getId(),
                verified.getEmail(),
                verified.getFullName(),
                verified.getRole(),
                verified.getCreatedAt()
        );
    }

    @PostMapping(path = "/resend-verification", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResendVerificationResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        User user = emailVerificationService.resend(request.email());
        return new ResendVerificationResponse(
                user.getEmail(),
                emailVerificationService.isMailConfigured(),
                emailVerificationService.currentDevCode(user)
        );
    }
}
