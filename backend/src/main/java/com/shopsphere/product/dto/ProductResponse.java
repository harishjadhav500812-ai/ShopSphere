package com.shopsphere.product.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductResponse(
        Long id,
        String name,
        String slug,
        String description,
        BigDecimal price,
        String priceCurrency,
        String sku,
        Integer stock,
        boolean active,
        Long sellerId,
        Long categoryId,
        Instant createdAt,
        Instant updatedAt
) {
}
