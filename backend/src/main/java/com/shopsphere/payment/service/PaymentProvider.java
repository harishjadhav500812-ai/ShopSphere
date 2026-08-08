package com.shopsphere.payment.service;

import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResult;

public interface PaymentProvider {

    PaymentResult processPayment(PaymentRequest request);
}
