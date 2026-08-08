package com.shopsphere.order.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.service.OrderService;

@RestController
@RequestMapping(path = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        Long userId = uid == null ? null : uid.longValue();
        return orderService.createOrderFromCart(userId);
    }
}
