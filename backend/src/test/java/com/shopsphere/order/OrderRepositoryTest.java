package com.shopsphere.order;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
}
