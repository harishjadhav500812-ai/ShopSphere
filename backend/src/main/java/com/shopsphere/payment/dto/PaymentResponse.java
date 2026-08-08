package com.shopsphere.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.shopsphere.payment.domain.PaymentStatus;

public record PaymentResponse(
        Long id,
        Long orderId,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String provider,
        String transactionId,
        Instant createdAt,
        Instant updatedAt
) {
}
