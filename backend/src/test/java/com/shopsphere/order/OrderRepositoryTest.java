package com.shopsphere.order;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
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
                        OrderStatus.OUT_FOR_DELIVERY,
                        OrderStatus.DELIVERED,
                        OrderStatus.CANCELLED
                );
    }

    @Test
    void saveAndLoadOrderWithVersion() {
        Order saved = orderRepository.save(new Order(1001L, OrderStatus.PENDING, new BigDecimal("49.98"), "USD"));

        Order found = orderRepository.findById(saved.getId()).orElseThrow();

        assertThat(found.getId()).isNotNull();
        assertThat(found.getUserId()).isEqualTo(1001L);
        assertThat(found.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(found.getTotalAmount()).isEqualByComparingTo("49.98");
        assertThat(found.getCurrency()).isEqualTo("USD");
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
        assertThat(found.getVersion()).isNotNull();
    }

    @Test
    void createOrderWithLineItemsAndCascade() {
        Order order = new Order(1002L, OrderStatus.PENDING, new BigDecimal("129.99"), "USD");

        OrderItem item1 = new OrderItem(
                order,
                101L,
                501L,
                "SKU-101",
                "Wireless Mouse",
                new BigDecimal("29.99"),
                "USD",
                1,
                new BigDecimal("29.99")
        );

        OrderItem item2 = new OrderItem(
                order,
                102L,
                502L,
                "SKU-102",
                "Mechanical Keyboard",
                new BigDecimal("100.00"),
                "USD",
                1,
                new BigDecimal("100.00")
        );

        order.getItems().add(item1);
        order.getItems().add(item2);

        Order saved = orderRepository.save(order);

        Order reloaded = orderRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getItems()).hasSize(2);
        assertThat(reloaded.getItems()).extracting(OrderItem::getProductName)
                .containsExactlyInAnyOrder("Wireless Mouse", "Mechanical Keyboard");
    }

    @Test
    void repositoryQueriesByUserId() {
        orderRepository.save(new Order(2001L, OrderStatus.PENDING, new BigDecimal("10.00"), "USD"));
        orderRepository.save(new Order(2001L, OrderStatus.CONFIRMED, new BigDecimal("20.00"), "USD"));
        orderRepository.save(new Order(2002L, OrderStatus.PENDING, new BigDecimal("30.00"), "USD"));

        List<Order> user2001Orders = orderRepository.findByUserIdOrderByCreatedAtDesc(2001L);

        assertThat(user2001Orders).hasSize(2);
        assertThat(user2001Orders).allMatch(o -> o.getUserId().equals(2001L));
    }

    @Test
    void repositoryQueriesBySellerId() {
        Long sellerA = 901L;
        Long sellerB = 902L;

        Order o1 = new Order(3001L, OrderStatus.CONFIRMED, new BigDecimal("50.00"), "USD");
        OrderItem item1 = new OrderItem(o1, 11L, sellerA, "SKU-A", "Item A", new BigDecimal("50.00"), "USD", 1, new BigDecimal("50.00"));
        o1.getItems().add(item1);
        orderRepository.save(o1);

        Order o2 = new Order(3002L, OrderStatus.PROCESSING, new BigDecimal("80.00"), "USD");
        OrderItem item2 = new OrderItem(o2, 12L, sellerB, "SKU-B", "Item B", new BigDecimal("80.00"), "USD", 1, new BigDecimal("80.00"));
        o2.getItems().add(item2);
        orderRepository.save(o2);

        List<Order> sellerAOrders = orderRepository.findBySellerId(sellerA, Pageable.unpaged()).getContent();

        assertThat(sellerAOrders).hasSize(1);
        assertThat(sellerAOrders.get(0).getId()).isEqualTo(o1.getId());
    }

    @Test
    void orderItemRepositoryFindsByOrderIdAndSellerId() {
        Long sellerX = 801L;
        Long sellerY = 802L;

        Order o1 = orderRepository.save(new Order(4001L, OrderStatus.CONFIRMED, new BigDecimal("150.00"), "USD"));
        Order o2 = orderRepository.save(new Order(4002L, OrderStatus.PROCESSING, new BigDecimal("200.00"), "USD"));

        OrderItem item1 = orderItemRepository.save(new OrderItem(o1, 21L, sellerX, "SKU-X", "Item X", new BigDecimal("50.00"), "USD", 1, new BigDecimal("50.00")));
        OrderItem item2 = orderItemRepository.save(new OrderItem(o1, 22L, sellerY, "SKU-Y", "Item Y", new BigDecimal("100.00"), "USD", 1, new BigDecimal("100.00")));

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
        assertThat(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.OUT_FOR_DELIVERY)).isTrue();
        assertThat(OrderStatus.OUT_FOR_DELIVERY.canTransitionTo(OrderStatus.DELIVERED)).isTrue();

        // Invalid transitions
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.SHIPPED)).isFalse();
        assertThat(OrderStatus.PENDING.canTransitionTo(OrderStatus.DELIVERED)).isFalse();
        assertThat(OrderStatus.SHIPPED.canTransitionTo(OrderStatus.DELIVERED)).isFalse();
        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.PENDING)).isFalse();
        assertThat(OrderStatus.CANCELLED.canTransitionTo(OrderStatus.CONFIRMED)).isFalse();
        assertThat(OrderStatus.DELIVERED.canTransitionTo(OrderStatus.CANCELLED)).isFalse();
    }
}
