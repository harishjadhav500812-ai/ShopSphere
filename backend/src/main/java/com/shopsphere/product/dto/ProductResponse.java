package com.shopsphere.product.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        Long sellerId,
        Instant createdAt,
        Instant updatedAt
) {
}
