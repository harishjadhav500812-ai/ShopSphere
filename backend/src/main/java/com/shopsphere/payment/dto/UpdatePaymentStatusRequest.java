package com.shopsphere.payment.dto;

import com.shopsphere.payment.domain.PaymentStatus;

import jakarta.validation.constraints.NotNull;

public record UpdatePaymentStatusRequest(
        @NotNull(message = "Payment status is required")
        PaymentStatus status
) {
}
