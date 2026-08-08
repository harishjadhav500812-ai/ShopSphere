package com.shopsphere.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.shopsphere.order.domain.OrderStatus;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
