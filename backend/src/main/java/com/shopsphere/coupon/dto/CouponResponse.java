package com.shopsphere.coupon.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.shopsphere.coupon.domain.DiscountType;

public record CouponResponse(
        Long id,
        String code,
        DiscountType discountType,
        BigDecimal discountValue,
        BigDecimal minimumOrderAmount,
        BigDecimal maximumDiscountAmount,
        Instant startAt,
        Instant expiresAt,
        Integer usageLimit,
        Integer usedCount,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
