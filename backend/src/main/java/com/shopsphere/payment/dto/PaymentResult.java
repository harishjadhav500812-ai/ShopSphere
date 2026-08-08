package com.shopsphere.payment.dto;

public record PaymentResult(
        boolean success,
        String transactionId,
        String message
) {
}
