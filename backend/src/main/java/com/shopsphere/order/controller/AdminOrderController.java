package com.shopsphere.order.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.dto.UpdateOrderStatusRequest;
import com.shopsphere.order.service.OrderService;
import com.shopsphere.payment.dto.PaymentResponse;
import com.shopsphere.payment.dto.UpdatePaymentStatusRequest;
import com.shopsphere.payment.service.PaymentService;
import com.shopsphere.shipping.dto.ShippingResponse;
import com.shopsphere.shipping.dto.UpdateShippingStatusRequest;
import com.shopsphere.shipping.service.ShippingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api/admin/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminOrderController {

    private final OrderService orderService;
    private final ShippingService shippingService;
    private final PaymentService paymentService;

    public AdminOrderController(
            OrderService orderService,
            ShippingService shippingService,
            PaymentService paymentService
    ) {
        this.orderService = orderService;
        this.shippingService = shippingService;
        this.paymentService = paymentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Page<OrderResponse> getAllOrders(
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return orderService.getAllOrdersForAdmin(pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse getOrderById(@PathVariable Long id) {
        return orderService.getOrderForAdmin(id);
    }

    @PatchMapping(path = "/{id}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return orderService.updateOrderStatusByAdmin(id, request.status());
    }

    @PatchMapping(path = {"/{id}/shipping-status", "/{id}/shipment-status"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ShippingResponse updateShippingStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShippingStatusRequest request
    ) {
        return shippingService.updateShippingStatusByAdmin(id, request.status());
    }

    @PatchMapping(path = "/{id}/payment-status", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentResponse updatePaymentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentStatusRequest request
    ) {
        return paymentService.updatePaymentStatusByAdmin(id, request.status());
    }
}
