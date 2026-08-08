package com.shopsphere.shipping.service;

public record ShipmentResult(
        boolean success,
        String trackingNumber,
        String carrier,
        String message
) {
}
