package com.shopsphere.coupon.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.shopsphere.coupon.domain.DiscountType;

import jakarta.validation.constraints.DecimalMin;

public record UpdateCouponRequest(
        DiscountType discountType,

        @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
        BigDecimal discountValue,

        @DecimalMin(value = "0.00", message = "Minimum order amount cannot be negative")
        BigDecimal minimumOrderAmount,

        @DecimalMin(value = "0.00", message = "Maximum discount amount cannot be negative")
        BigDecimal maximumDiscountAmount,

        Instant startAt,
        Instant expiresAt,

        Integer usageLimit,
        Boolean active
) {
}
