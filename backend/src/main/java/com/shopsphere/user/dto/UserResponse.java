package com.shopsphere.user.dto;

import java.time.Instant;

import com.shopsphere.user.domain.Role;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        Role role,
        Instant createdAt
) {
}
