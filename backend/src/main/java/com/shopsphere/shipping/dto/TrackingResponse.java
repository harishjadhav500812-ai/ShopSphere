package com.shopsphere.shipping.dto;

import java.time.Instant;

import com.shopsphere.shipping.domain.ShippingStatus;

public record TrackingResponse(
        Long orderId,
        String trackingNumber,
        String carrier,
        ShippingStatus shippingStatus,
        Instant shippedAt,
        Instant deliveredAt,
        ShippingAddressDto shippingAddress
) {
}
