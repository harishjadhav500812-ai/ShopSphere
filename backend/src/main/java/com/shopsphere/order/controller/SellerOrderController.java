package com.shopsphere.order.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.service.OrderService;

@RestController
@RequestMapping(path = "/api/seller/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class SellerOrderController {

    private final OrderService orderService;

    public SellerOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private Long currentSellerId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    @GetMapping
    @PreAuthorize("hasRole('SELLER')")
    public Page<OrderResponse> getSellerOrders(
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return orderService.getSellerOrders(currentSellerId(authentication), pageable);
    }
}
