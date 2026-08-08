package com.shopsphere.shipping.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class SimulatedShippingProvider implements ShippingProvider {

    @Override
    public ShipmentResult createShipment(ShipmentRequest request) {
        if (request == null || request.orderId() == null || request.address() == null) {
            return new ShipmentResult(false, null, null, "Invalid shipment request");
        }
        String trackingNumber = "SIM-TRACK-" + UUID.randomUUID();
        return new ShipmentResult(true, trackingNumber, "SimulatedExpress", "Shipment created successfully");
    }
}
