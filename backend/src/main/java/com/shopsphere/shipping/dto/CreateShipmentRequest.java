package com.shopsphere.shipping.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record CreateShipmentRequest(
        @NotNull(message = "Shipping address is required")
        @Valid
        ShippingAddressDto shippingAddress
) {
}
