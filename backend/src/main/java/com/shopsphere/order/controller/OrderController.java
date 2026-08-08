package com.shopsphere.order.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.order.dto.CreateOrderRequest;
import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.service.OrderService;
import com.shopsphere.payment.dto.PaymentResponse;
import com.shopsphere.payment.service.PaymentService;
import com.shopsphere.shipping.dto.CreateShipmentRequest;
import com.shopsphere.shipping.dto.ShippingResponse;
import com.shopsphere.shipping.dto.TrackingResponse;
import com.shopsphere.shipping.service.ShippingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController {

    private final OrderService orderService;
    private final ShippingService shippingService;
    private final PaymentService paymentService;

    public OrderController(OrderService orderService, ShippingService shippingService, PaymentService paymentService) {
        this.orderService = orderService;
        this.shippingService = shippingService;
        this.paymentService = paymentService;
    }

    private Long currentUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(
            @RequestBody(required = false) CreateOrderRequest request,
            Authentication authentication
    ) {
        return orderService.createOrderFromCart(currentUserId(authentication), request);
    }

    @GetMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public Page<OrderResponse> getCustomerOrders(
            Authentication authentication,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return orderService.getCustomerOrders(currentUserId(authentication), pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public OrderResponse getOrderById(@PathVariable Long id, Authentication authentication) {
        return orderService.getOrderById(id, currentUserId(authentication));
    }

    @PostMapping("/{id}/payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentResponse payOrder(@PathVariable Long id, Authentication authentication) {
        return paymentService.createAndProcessPayment(id, currentUserId(authentication));
    }

    @GetMapping("/{id}/payment")
    @PreAuthorize("hasRole('CUSTOMER')")
    public PaymentResponse getPayment(@PathVariable Long id, Authentication authentication) {
        return paymentService.getPaymentForCustomer(id, currentUserId(authentication));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public OrderResponse cancelOrder(@PathVariable Long id, Authentication authentication) {
        return orderService.cancelOrder(id, currentUserId(authentication));
    }

    @PostMapping({"/{id}/shipping", "/{id}/shipment"})
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ShippingResponse createShipment(
            @PathVariable Long id,
            @Valid @RequestBody CreateShipmentRequest request,
            Authentication authentication
    ) {
        return shippingService.createShipment(id, currentUserId(authentication), request);
    }

    @GetMapping({"/{id}/shipping", "/{id}/shipment"})
    @PreAuthorize("hasRole('CUSTOMER')")
    public ShippingResponse getShipment(@PathVariable Long id, Authentication authentication) {
        return shippingService.getShipmentForCustomer(id, currentUserId(authentication));
    }

    @GetMapping("/{id}/tracking")
    @PreAuthorize("hasRole('CUSTOMER')")
    public TrackingResponse getTracking(@PathVariable Long id, Authentication authentication) {
        return shippingService.getTrackingForCustomer(id, currentUserId(authentication));
    }
}
