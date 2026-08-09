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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.dto.UpdateOrderStatusRequest;
import com.shopsphere.order.service.OrderService;

import jakarta.validation.Valid;

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

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public OrderResponse getSellerOrderById(@PathVariable Long id, Authentication authentication) {
        return orderService.getSellerOrderById(id, currentSellerId(authentication));
    }

    /**
     * Lets a seller advance the fulfillment status of an order containing their products.
     * Restricted to CONFIRMED / PROCESSING / SHIPPED — enforced in OrderService regardless
     * of what is submitted here. DELIVERED and CANCELLED remain outside seller control.
     */
    @PatchMapping(path = "/{id}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            Authentication authentication
    ) {
        return orderService.updateOrderStatusBySeller(id, currentSellerId(authentication), request.status());
    }
}
