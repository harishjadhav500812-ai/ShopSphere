package com.shopsphere.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.shopsphere.order.domain.OrderStatus;

public record OrderListItem(
        Long id,
        OrderStatus status,
        BigDecimal totalAmount,
        String currency,
        Instant createdAt,
        Instant updatedAt
) {
}
