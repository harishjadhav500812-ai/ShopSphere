package com.shopsphere.shipping.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shopsphere.shipping.domain.Shipping;

public interface ShippingRepository extends JpaRepository<Shipping, Long> {

    Optional<Shipping> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    Optional<Shipping> findByTrackingNumber(String trackingNumber);
}
