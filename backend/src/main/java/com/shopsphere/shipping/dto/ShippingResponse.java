package com.shopsphere.shipping.dto;

import java.time.Instant;

import com.shopsphere.shipping.domain.ShippingStatus;

public record ShippingResponse(
        Long id,
        Long orderId,
        String trackingNumber,
        String carrier,
        ShippingStatus shippingStatus,
        ShippingAddressDto shippingAddress,
        Instant shippedAt,
        Instant deliveredAt,
        Instant createdAt,
        Instant updatedAt
) {
}
