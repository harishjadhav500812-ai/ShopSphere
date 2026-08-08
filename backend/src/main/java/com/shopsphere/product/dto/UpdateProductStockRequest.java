package com.shopsphere.product.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateProductStockRequest(
        @NotNull(message = "quantity is required")
        @PositiveOrZero(message = "quantity must be positive or zero")
        Integer quantity
) {
}
