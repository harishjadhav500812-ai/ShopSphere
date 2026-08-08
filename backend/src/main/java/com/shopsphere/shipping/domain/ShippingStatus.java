package com.shopsphere.shipping.domain;

public enum ShippingStatus {
    NOT_CREATED,
    CREATED,
    READY_TO_SHIP,
    READY,
    SHIPPED,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(ShippingStatus target) {
        if (target == null) {
            return false;
        }
        return switch (this) {
            case NOT_CREATED -> target == CREATED || target == READY_TO_SHIP || target == READY;
            case CREATED -> target == READY_TO_SHIP || target == READY || target == SHIPPED || target == CANCELLED;
            case READY_TO_SHIP, READY -> target == SHIPPED || target == CANCELLED;
            case SHIPPED -> target == IN_TRANSIT || target == CANCELLED;
            case IN_TRANSIT -> target == OUT_FOR_DELIVERY || target == CANCELLED;
            case OUT_FOR_DELIVERY -> target == DELIVERED || target == CANCELLED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
