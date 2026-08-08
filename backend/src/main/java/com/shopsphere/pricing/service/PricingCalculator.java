package com.shopsphere.pricing.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.shopsphere.coupon.domain.Coupon;
import com.shopsphere.coupon.domain.DiscountType;

@Component
public class PricingCalculator {

    private final BigDecimal taxRate;

    public PricingCalculator(@Value("${shopsphere.pricing.tax-rate:0.00}") BigDecimal taxRate) {
        this.taxRate = taxRate != null ? taxRate : BigDecimal.ZERO;
    }

    public PricingResult calculatePricing(BigDecimal subtotal, Coupon coupon) {
        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String couponCode = null;

        if (coupon != null) {
            couponCode = coupon.getCode();
            if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
                BigDecimal rawDiscount = subtotal.multiply(coupon.getDiscountValue())
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
                if (coupon.getMaximumDiscountAmount() != null && rawDiscount.compareTo(coupon.getMaximumDiscountAmount()) > 0) {
                    discountAmount = coupon.getMaximumDiscountAmount().setScale(2, RoundingMode.HALF_UP);
                } else {
                    discountAmount = rawDiscount;
                }
            } else if (coupon.getDiscountType() == DiscountType.FIXED_AMOUNT) {
                discountAmount = coupon.getDiscountValue().setScale(2, RoundingMode.HALF_UP);
            }

            // Discount cannot exceed subtotal
            if (discountAmount.compareTo(subtotal) > 0) {
                discountAmount = subtotal;
            }
        }

        BigDecimal taxableAmount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal taxAmount = taxableAmount.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        totalAmount = totalAmount.max(BigDecimal.ZERO);

        return new PricingResult(subtotal, discountAmount, taxAmount, totalAmount, couponCode);
    }
}
