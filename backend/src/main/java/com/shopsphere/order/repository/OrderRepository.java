package com.shopsphere.order.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shopsphere.order.domain.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findById(Long id);

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query(
            value = "SELECT DISTINCT o FROM Order o JOIN o.items oi WHERE oi.sellerId = :sellerId",
            countQuery = "SELECT COUNT(DISTINCT o) FROM Order o JOIN o.items oi WHERE oi.sellerId = :sellerId"
    )
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);
}
