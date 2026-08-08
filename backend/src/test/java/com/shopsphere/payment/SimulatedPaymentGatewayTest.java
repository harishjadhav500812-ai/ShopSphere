package com.shopsphere.payment;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResult;
import com.shopsphere.payment.service.SimulatedPaymentGateway;

class SimulatedPaymentGatewayTest {

    private final SimulatedPaymentGateway paymentGateway = new SimulatedPaymentGateway();

    @Test
    void successfulPayment() {
        PaymentRequest request = new PaymentRequest(101L, new BigDecimal("49.99"), "USD");
        PaymentResult result = paymentGateway.processPayment(request);

        assertThat(result.success()).isTrue();
        assertThat(result.transactionId()).startsWith("SIM-");
        assertThat(result.message()).isEqualTo("Simulated payment successful");
    }

    @Test
    void paymentFailsWhenAmountIsZeroOrNegative() {
        PaymentRequest zeroRequest = new PaymentRequest(102L, BigDecimal.ZERO, "USD");
        PaymentResult zeroResult = paymentGateway.processPayment(zeroRequest);

        assertThat(zeroResult.success()).isFalse();
        assertThat(zeroResult.transactionId()).isNull();

        PaymentRequest nullRequest = new PaymentRequest(103L, null, "USD");
        PaymentResult nullResult = paymentGateway.processPayment(nullRequest);

        assertThat(nullResult.success()).isFalse();
    }
}
