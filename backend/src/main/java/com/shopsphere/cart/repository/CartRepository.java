package com.shopsphere.cart.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.shopsphere.cart.domain.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserIdAndActiveTrue(Long userId);
    Optional<Cart> findByIdAndUserId(Long id, Long userId);
}
