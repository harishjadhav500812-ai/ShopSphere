package com.shopsphere.review.dto;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long productId,
        Long userId,
        String userFullName,
        Integer rating,
        String comment,
        Instant createdAt,
        Instant updatedAt
) {
}
