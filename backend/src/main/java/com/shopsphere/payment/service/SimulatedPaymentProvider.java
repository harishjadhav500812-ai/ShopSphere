package com.shopsphere.payment.service;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResult;

@Service
public class SimulatedPaymentProvider implements PaymentGateway {

    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        if (request == null || request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return new PaymentResult(false, null, "Invalid payment amount");
        }
        String txId = "SIM-PAY-" + UUID.randomUUID();
        return new PaymentResult(true, txId, "Simulated payment successful");
    }
}
