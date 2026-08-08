package com.shopsphere.cart.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CartResponse(
        Long cartId,
        List<CartItemResponse> items,
        Map<String, BigDecimal> totals,
        Integer itemCount,
        Instant createdAt,
        Instant updatedAt
) {}
