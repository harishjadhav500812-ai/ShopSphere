package com.shopsphere.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.shopsphere.order.domain.OrderStatus;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        String couponCode,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
