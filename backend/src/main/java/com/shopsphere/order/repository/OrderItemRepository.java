package com.shopsphere.order.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shopsphere.order.domain.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("select oi from OrderItem oi where oi.order.id = :orderId")
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);

    @Query("select oi from OrderItem oi where oi.order.id in :orderIds")
    List<OrderItem> findByOrderIdIn(@Param("orderIds") Collection<Long> orderIds);

    @Query("select oi from OrderItem oi where oi.order.id in :orderIds and oi.sellerId = :sellerId")
    List<OrderItem> findByOrderIdInAndSellerId(@Param("orderIds") Collection<Long> orderIds, @Param("sellerId") Long sellerId);

    @Query("select oi from OrderItem oi where oi.order.id = :orderId and oi.sellerId = :sellerId")
    List<OrderItem> findByOrderIdAndSellerId(@Param("orderId") Long orderId, @Param("sellerId") Long sellerId);
}
