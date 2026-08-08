package com.shopsphere.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateCartItemRequest(
        @NotNull Long productId,
        @NotNull @Min(1) Integer quantity
) {}
