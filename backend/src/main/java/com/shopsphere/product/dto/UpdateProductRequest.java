package com.shopsphere.product.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(
        @NotBlank(message = "name is required")
        @Size(max = 200, message = "name must be at most 200 characters")
        String name,
        String description,
        @NotNull(message = "price is required")
        @PositiveOrZero(message = "price must be positive or zero")
        BigDecimal price,
        @NotBlank(message = "priceCurrency is required")
        @Pattern(regexp = "[A-Z]{3}", message = "priceCurrency must be a 3-letter uppercase code")
        String priceCurrency,
        @Size(max = 64, message = "sku must be at most 64 characters")
        String sku,
        @NotNull(message = "stock is required")
        @PositiveOrZero(message = "stock must be positive or zero")
        Integer stock,
        @NotNull(message = "categoryId is required")
        Long categoryId,
        @Size(max = 1024, message = "imageUrl must be at most 1024 characters")
        String imageUrl
) {
}
