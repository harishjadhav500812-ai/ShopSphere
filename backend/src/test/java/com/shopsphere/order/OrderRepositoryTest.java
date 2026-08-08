package com.shopsphere.order;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;

@SpringBootTest
@ActiveProfiles("test")
class OrderRepositoryTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Test
    void orderStatusHasInitialValues() {
        assertThat(Arrays.asList(OrderStatus.values()))
                .containsExactly(
                        OrderStatus.PENDING,
                        OrderStatus.CONFIRMED,
                        OrderStatus.PROCESSING,
                        OrderStatus.SHIPPED,
                        OrderStatus.DELIVERED,
                        OrderStatus.CANCELLED
                );
    }

    @Test
    void saveAndLoadOrderWithVersion() {
        Order saved = orderRepository.save(new Order(1001L, OrderStatus.PENDING, new BigDecimal("49.98"), "USD"));

        Order found = orderRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getUserId()).isEqualTo(1001L);
        assertThat(found.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(found.getTotalAmount()).isEqualByComparingTo("49.98");
        assertThat(found.getCurrency()).isEqualTo("USD");
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
        assertThat(found.getVersion()).isNotNull();
    }

    @Test
    void saveAndLoadOrderItemsWithSnapshotFields() {
        Order order = orderRepository.save(new Order(1002L, OrderStatus.CONFIRMED, new BigDecimal("59.98"), "USD"));
        OrderItem item = orderItemRepository.save(new OrderItem(
                order,
                2001L,
                3001L,
                "SKU-ORDER-1",
                "Snapshot Product",
                new BigDecimal("29.99"),
                "USD",
                2,
                new BigDecimal("59.98")
        ));

        OrderItem found = orderItemRepository.findById(item.getId()).orElseThrow();

        assertThat(found.getOrderId()).isEqualTo(order.getId());
        assertThat(found.getProductId()).isEqualTo(2001L);
        assertThat(found.getSellerId()).isEqualTo(3001L);
        assertThat(found.getSku()).isEqualTo("SKU-ORDER-1");
        assertThat(found.getProductName()).isEqualTo("Snapshot Product");
        assertThat(found.getUnitPriceAmount()).isEqualByComparingTo("29.99");
        assertThat(found.getPriceCurrency()).isEqualTo("USD");
        assertThat(found.getQuantity()).isEqualTo(2);
        assertThat(found.getLineTotal()).isEqualByComparingTo("59.98");
    }

    @Test
    void findCustomerOrders() {
        Order first = orderRepository.save(new Order(1003L, OrderStatus.PENDING, new BigDecimal("10.00"), "USD"));
        Order second = orderRepository.save(new Order(1003L, OrderStatus.SHIPPED, new BigDecimal("20.00"), "USD"));
        orderRepository.save(new Order(9999L, OrderStatus.PENDING, new BigDecimal("30.00"), "USD"));

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(1003L);
        var page = orderRepository.findByUserId(1003L, PageRequest.of(0, 10));

        assertThat(orders).extracting(Order::getId).contains(first.getId(), second.getId());
        assertThat(orders).extracting(Order::getUserId).containsOnly(1003L);
        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getContent()).extracting(Order::getUserId).containsOnly(1003L);
    }

    @Test
    void findOrderItemsByOrderIdAndOrderIdIn() {
        Order order = orderRepository.save(new Order(1004L, OrderStatus.PENDING, new BigDecimal("42.00"), "USD"));
        Order otherOrder = orderRepository.save(new Order(1005L, OrderStatus.PENDING, new BigDecimal("12.00"), "USD"));

        OrderItem first = orderItemRepository.save(new OrderItem(order, 4001L, 5001L, "SKU-A", "Product A", new BigDecimal("20.00"), "USD", 1, new BigDecimal("20.00")));
        OrderItem second = orderItemRepository.save(new OrderItem(order, 4002L, 5002L, "SKU-B", "Product B", new BigDecimal("22.00"), "USD", 1, new BigDecimal("22.00")));
        OrderItem third = orderItemRepository.save(new OrderItem(otherOrder, 4003L, 5003L, "SKU-C", "Product C", new BigDecimal("12.00"), "USD", 1, new BigDecimal("12.00")));

        assertThat(orderItemRepository.findByOrderId(order.getId()))
                .extracting(OrderItem::getId)
                .containsExactlyInAnyOrder(first.getId(), second.getId());

        assertThat(orderItemRepository.findByOrderIdIn(List.of(order.getId(), otherOrder.getId())))
                .extracting(OrderItem::getId)
                .containsExactlyInAnyOrder(first.getId(), second.getId(), third.getId());
    }

    @Test
    void findOrdersBySellerIdAndSellerItems() {
        Long sellerX = 7701L;
        Long sellerY = 7702L;

        Order o1 = orderRepository.save(new Order(1010L, OrderStatus.PENDING, new BigDecimal("100.00"), "USD"));
        Order o2 = orderRepository.save(new Order(1011L, OrderStatus.PENDING, new BigDecimal("50.00"), "USD"));

        OrderItem item1 = orderItemRepository.save(new OrderItem(o1, 8001L, sellerX, "SKU-X", "Product X", new BigDecimal("40.00"), "USD", 1, new BigDecimal("40.00")));
        OrderItem item2 = orderItemRepository.save(new OrderItem(o1, 8002L, sellerY, "SKU-Y", "Product Y", new BigDecimal("60.00"), "USD", 1, new BigDecimal("60.00")));
        OrderItem item3 = orderItemRepository.save(new OrderItem(o2, 8003L, sellerY, "SKU-Y2", "Product Y2", new BigDecimal("50.00"), "USD", 1, new BigDecimal("50.00")));

        Page<Order> sellerXOrders = orderRepository.findBySellerId(sellerX, PageRequest.of(0, 10));
        Page<Order> sellerYOrders = orderRepository.findBySellerId(sellerY, PageRequest.of(0, 10));

        assertThat(sellerXOrders.getContent()).extracting(Order::getId).containsExactly(o1.getId());
        assertThat(sellerYOrders.getContent()).extracting(Order::getId).contains(o1.getId(), o2.getId());

        List<OrderItem> sellerXItemsForO1 = orderItemRepository.findByOrderIdAndSellerId(o1.getId(), sellerX);
        assertThat(sellerXItemsForO1).extracting(OrderItem::getId).containsExactly(item1.getId());

        List<OrderItem> sellerXItemsInBatch = orderItemRepository.findByOrderIdInAndSellerId(List.of(o1.getId(), o2.getId()), sellerX);
        assertThat(sellerXItemsInBatch).extracting(OrderItem::getId).containsExactly(item1.getId());
    }

    @Test
    void orderStatusTransitions() {
        // Valid transitions
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.CONFIRMED)).isTrue();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.CANCELLED)).isTrue();
        assertThat(OrderStatus.CONFIRMED.canTransitionTo(OrderStatus.PROCESSING)).isTrue();
        assertThat(OrderStatus.PROCESSING.canTransitionTo(OrderStatus.SHIPPED)).isTrue();
        assertThat(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED)).isTrue();

        // Invalid transitions
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.SHIPPED)).isFalse();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.DELIVERED)).isFalse();
        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.PENDING)).isFalse();
        assertThat(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.CONFIRMED)).isFalse();
        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.CANCELLED)).isFalse();
    }
}
