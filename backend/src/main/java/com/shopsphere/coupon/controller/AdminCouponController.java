package com.shopsphere.coupon.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.coupon.dto.CouponResponse;
import com.shopsphere.coupon.dto.CreateCouponRequest;
import com.shopsphere.coupon.dto.UpdateCouponRequest;
import com.shopsphere.coupon.service.CouponService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api/admin/coupons", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        return couponService.createCoupon(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<CouponResponse> getAllCoupons() {
        return couponService.getAllCoupons();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse getCouponById(@PathVariable Long id) {
        return couponService.getCouponById(id);
    }

    @PatchMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse updateCoupon(@PathVariable Long id, @Valid @RequestBody UpdateCouponRequest request) {
        return couponService.updateCoupon(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
    }
}
