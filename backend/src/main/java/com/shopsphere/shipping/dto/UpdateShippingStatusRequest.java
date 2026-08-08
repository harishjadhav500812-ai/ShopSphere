package com.shopsphere.shipping.dto;

import com.shopsphere.shipping.domain.ShippingStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateShippingStatusRequest(
        @NotNull(message = "Shipping status is required")
        ShippingStatus status
) {
}
