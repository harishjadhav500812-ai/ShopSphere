package com.shopsphere.payment.domain;

public enum PaymentStatus {
    CREATED,
    PENDING,
    SUCCESS,
    FAILED,
    CANCELLED;

    public boolean canTransitionTo(PaymentStatus target) {
        if (target == null) {
            return false;
        }
        return switch (this) {
            case CREATED -> target == PENDING || target == FAILED || target == CANCELLED;
            case PENDING -> target == SUCCESS || target == FAILED || target == CANCELLED;
            case SUCCESS, FAILED, CANCELLED -> false;
        };
    }
}
