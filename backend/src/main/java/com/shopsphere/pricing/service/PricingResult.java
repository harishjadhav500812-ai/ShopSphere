package com.shopsphere.pricing.service;

import java.math.BigDecimal;

public record PricingResult(
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String couponCode
) {
}
