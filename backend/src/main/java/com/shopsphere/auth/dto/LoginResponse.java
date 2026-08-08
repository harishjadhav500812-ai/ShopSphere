package com.shopsphere.auth.dto;

import com.shopsphere.user.dto.UserResponse;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
}
