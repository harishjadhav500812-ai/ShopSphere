package com.shopsphere.shipping.service;

public interface ShippingProvider {

    ShipmentResult createShipment(ShipmentRequest request);
}
