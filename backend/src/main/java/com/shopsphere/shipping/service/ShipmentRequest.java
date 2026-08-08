package com.shopsphere.shipping.service;

import com.shopsphere.shipping.dto.ShippingAddressDto;

public record ShipmentRequest(
        Long orderId,
        ShippingAddressDto address
) {
}
