package com.shopsphere.payment.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.order.service.OrderService;
import com.shopsphere.payment.domain.Payment;
import com.shopsphere.payment.domain.PaymentStatus;
import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResponse;
import com.shopsphere.payment.dto.PaymentResult;
import com.shopsphere.payment.repository.PaymentRepository;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentProvider paymentProvider;
    private final OrderService orderService;

    public PaymentService(
            PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            PaymentProvider paymentProvider,
            @Lazy OrderService orderService
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentProvider = paymentProvider;
        this.orderService = orderService;
    }

    @Transactional
    public PaymentResponse createAndProcessPayment(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not in PENDING status");
        }

        if (paymentRepository.existsByOrderId(orderId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment already exists for order");
        }

        Payment payment = new Payment(order, order.getTotalAmount(), order.getCurrency(), "SimulatedPaymentProvider");
        payment.setStatus(PaymentStatus.PENDING);
        Payment savedPayment = paymentRepository.save(payment);

        // Lock inventory and deduct stock
        orderService.deductStockForOrder(order.getId());

        PaymentResult result = paymentProvider.processPayment(
                new PaymentRequest(order.getId(), order.getTotalAmount(), order.getCurrency())
        );

        if (!result.success()) {
            savedPayment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(savedPayment);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment failed: " + result.message());
        }

        savedPayment.setStatus(PaymentStatus.SUCCESS);
        savedPayment.setTransactionId(result.transactionId());
        savedPayment = paymentRepository.save(savedPayment);

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        return toPaymentResponse(savedPayment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentForCustomer(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for order"));

        return toPaymentResponse(payment);
    }

    @Transactional
    public PaymentResponse updatePaymentStatusByAdmin(Long orderId, PaymentStatus newStatus) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for order"));

        if (!payment.getStatus().canTransitionTo(newStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid payment status transition from " + payment.getStatus() + " to " + newStatus
            );
        }

        payment.setStatus(newStatus);
        Payment savedPayment = paymentRepository.save(payment);

        Order order = payment.getOrder();
        if (newStatus == PaymentStatus.SUCCESS && order.getStatus() == OrderStatus.PENDING) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        return toPaymentResponse(savedPayment);
    }

    public PaymentResponse toPaymentResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getOrder().getId(),
                p.getAmount(),
                p.getCurrency(),
                p.getStatus(),
                p.getProvider(),
                p.getTransactionId(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
