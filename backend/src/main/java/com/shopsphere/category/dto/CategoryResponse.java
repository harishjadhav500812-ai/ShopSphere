package com.shopsphere.category.dto;

import java.time.Instant;

import com.shopsphere.user.domain.Role;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        Long parentId,
        Instant createdAt,
        Instant updatedAt
) {
}
