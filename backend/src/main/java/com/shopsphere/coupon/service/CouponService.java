package com.shopsphere.coupon.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.coupon.domain.Coupon;
import com.shopsphere.coupon.dto.CouponResponse;
import com.shopsphere.coupon.dto.CreateCouponRequest;
import com.shopsphere.coupon.dto.UpdateCouponRequest;
import com.shopsphere.coupon.repository.CouponRepository;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Transactional
    public CouponResponse createCoupon(CreateCouponRequest request) {
        if (couponRepository.existsByCodeIgnoreCase(request.code())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon code already exists");
        }

        Coupon coupon = new Coupon(
                request.code(),
                request.discountType(),
                request.discountValue(),
                request.minimumOrderAmount(),
                request.maximumDiscountAmount(),
                request.startAt(),
                request.expiresAt(),
                request.usageLimit(),
                request.active()
        );

        Coupon saved = couponRepository.save(coupon);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));
        return toResponse(coupon);
    }

    @Transactional
    public CouponResponse updateCoupon(Long id, UpdateCouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));

        if (request.discountType() != null) {
            coupon.setDiscountType(request.discountType());
        }
        if (request.discountValue() != null) {
            coupon.setDiscountValue(request.discountValue());
        }
        if (request.minimumOrderAmount() != null) {
            coupon.setMinimumOrderAmount(request.minimumOrderAmount());
        }
        if (request.maximumDiscountAmount() != null) {
            coupon.setMaximumDiscountAmount(request.maximumDiscountAmount());
        }
        if (request.startAt() != null) {
            coupon.setStartAt(request.startAt());
        }
        if (request.expiresAt() != null) {
            coupon.setExpiresAt(request.expiresAt());
        }
        if (request.usageLimit() != null) {
            coupon.setUsageLimit(request.usageLimit());
        }
        if (request.active() != null) {
            coupon.setActive(request.active());
        }

        Coupon saved = couponRepository.save(coupon);
        return toResponse(saved);
    }

    @Transactional
    public void deleteCoupon(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found"));
        couponRepository.delete(coupon);
    }

    @Transactional
    public Coupon validateAndApplyCoupon(String rawCode, BigDecimal subtotal) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            return null;
        }

        String normalizedCode = rawCode.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCodeIgnoreCaseForUpdate(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon is inactive");
        }

        Instant now = Instant.now();
        if (coupon.getStartAt() != null && now.isBefore(coupon.getStartAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon is not active yet");
        }

        if (coupon.getExpiresAt() != null && now.isAfter(coupon.getExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon has expired");
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon usage limit reached");
        }

        if (coupon.getMinimumOrderAmount() != null && subtotal.compareTo(coupon.getMinimumOrderAmount()) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subtotal does not meet minimum order amount");
        }

        coupon.incrementUsedCount();
        return couponRepository.save(coupon);
    }

    public CouponResponse toResponse(Coupon c) {
        return new CouponResponse(
                c.getId(),
                c.getCode(),
                c.getDiscountType(),
                c.getDiscountValue(),
                c.getMinimumOrderAmount(),
                c.getMaximumDiscountAmount(),
                c.getStartAt(),
                c.getExpiresAt(),
                c.getUsageLimit(),
                c.getUsedCount(),
                c.isActive(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
