package com.shopsphere.shipping.service;

import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.shipping.domain.Shipping;
import com.shopsphere.shipping.domain.ShippingStatus;
import com.shopsphere.shipping.dto.CreateShipmentRequest;
import com.shopsphere.shipping.dto.ShippingAddressDto;
import com.shopsphere.shipping.dto.ShippingResponse;
import com.shopsphere.shipping.dto.TrackingResponse;
import com.shopsphere.shipping.repository.ShippingRepository;

@Service
public class ShippingService {

    private final ShippingRepository shippingRepository;
    private final OrderRepository orderRepository;
    private final ShippingProvider shippingProvider;

    public ShippingService(ShippingRepository shippingRepository, OrderRepository orderRepository, ShippingProvider shippingProvider) {
        this.shippingRepository = shippingRepository;
        this.orderRepository = orderRepository;
        this.shippingProvider = shippingProvider;
    }

    @Transactional
    public ShippingResponse createShipment(Long orderId, Long userId, CreateShipmentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        if (order.getStatus() != OrderStatus.CONFIRMED && order.getStatus() != OrderStatus.PROCESSING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment cannot be created for order in status " + order.getStatus());
        }

        if (shippingRepository.existsByOrderId(orderId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment already exists for order");
        }

        ShipmentResult result = shippingProvider.createShipment(new ShipmentRequest(orderId, request.shippingAddress()));
        if (!result.success()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment creation failed: " + result.message());
        }

        ShippingAddressDto addr = request.shippingAddress();
        Shipping shipping = new Shipping(
                order,
                addr.recipientName(),
                addr.phone(),
                addr.addressLine1(),
                addr.addressLine2(),
                addr.city(),
                addr.state(),
                addr.postalCode(),
                addr.country(),
                result.trackingNumber(),
                result.carrier()
        );

        Shipping savedShipping = shippingRepository.save(shipping);

        if (order.getStatus() == OrderStatus.CONFIRMED && order.getStatus().canTransitionTo(OrderStatus.PROCESSING)) {
            order.setStatus(OrderStatus.PROCESSING);
            orderRepository.save(order);
        }

        return toShippingResponse(savedShipping);
    }

    @Transactional(readOnly = true)
    public ShippingResponse getShipmentForCustomer(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        Shipping shipping = shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No shipping information found for order"));

        return toShippingResponse(shipping);
    }

    @Transactional(readOnly = true)
    public TrackingResponse getTrackingForCustomer(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        Shipping shipping = shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No shipping information found for order"));

        return toTrackingResponse(shipping);
    }

    @Transactional
    public ShippingResponse updateShippingStatusByAdmin(Long orderId, ShippingStatus newStatus) {
        Shipping shipping = shippingRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No shipping information found for order"));

        Order order = shipping.getOrder();

        if (!shipping.getShippingStatus().canTransitionTo(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid shipping status transition from " + shipping.getShippingStatus() + " to " + newStatus);
        }

        shipping.setShippingStatus(newStatus);
        Instant now = Instant.now();

        if (shipping.getTrackingNumber() == null && (newStatus == ShippingStatus.SHIPPED || newStatus == ShippingStatus.READY || newStatus == ShippingStatus.READY_TO_SHIP)) {
            shipping.setTrackingNumber("SIM-TRACK-" + java.util.UUID.randomUUID());
        }

        if (newStatus == ShippingStatus.SHIPPED) {
            shipping.setShippedAt(now);
            if (order.getStatus().canTransitionTo(OrderStatus.SHIPPED)) {
                order.setStatus(OrderStatus.SHIPPED);
                orderRepository.save(order);
            }
        } else if (newStatus == ShippingStatus.DELIVERED) {
            shipping.setDeliveredAt(now);
            if (order.getStatus().canTransitionTo(OrderStatus.DELIVERED)) {
                order.setStatus(OrderStatus.DELIVERED);
                orderRepository.save(order);
            }
        }

        Shipping savedShipping = shippingRepository.save(shipping);
        return toShippingResponse(savedShipping);
    }

    private ShippingResponse toShippingResponse(Shipping s) {
        ShippingAddressDto address = new ShippingAddressDto(
                s.getRecipientName(),
                s.getPhone(),
                s.getAddressLine1(),
                s.getAddressLine2(),
                s.getCity(),
                s.getState(),
                s.getPostalCode(),
                s.getCountry()
        );
        return new ShippingResponse(
                s.getId(),
                s.getOrder().getId(),
                s.getTrackingNumber(),
                s.getCarrier(),
                s.getShippingStatus(),
                address,
                s.getShippedAt(),
                s.getDeliveredAt(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    private TrackingResponse toTrackingResponse(Shipping s) {
        ShippingAddressDto address = new ShippingAddressDto(
                s.getRecipientName(),
                s.getPhone(),
                s.getAddressLine1(),
                s.getAddressLine2(),
                s.getCity(),
                s.getState(),
                s.getPostalCode(),
                s.getCountry()
        );
        return new TrackingResponse(
                s.getOrder().getId(),
                s.getTrackingNumber(),
                s.getCarrier(),
                s.getShippingStatus(),
                s.getShippedAt(),
                s.getDeliveredAt(),
                address
        );
    }
}
