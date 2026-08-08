package com.shopsphere.product.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateProductStatusRequest(
        @NotNull(message = "active is required")
        Boolean active
) {
}
