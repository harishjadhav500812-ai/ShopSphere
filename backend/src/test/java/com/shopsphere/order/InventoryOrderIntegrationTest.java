package com.shopsphere.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.security.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InventoryOrderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Test
    void paymentDeductsExactStock() throws Exception {
        Long userId = uniqueId();
        Product product = createProduct("Deduct Stock", "20.00", "USD", 10, 5001L);

        Order order = createOrder(userId, "60.00", "USD");
        createOrderItem(order, product, 3);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStock()).isEqualTo(7);
    }

    @Test
    void paymentWithInsufficientStockFailsAndRollsBack() throws Exception {
        Long userId = uniqueId();
        Product product = createProduct("Low Stock Product", "20.00", "USD", 2, 5002L);

        Order order = createOrder(userId, "60.00", "USD");
        createOrderItem(order, product, 3);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isConflict());

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStock()).isEqualTo(2);

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void paymentWithExactStockSucceedsAndSetsStockToZero() throws Exception {
        Long userId = uniqueId();
        Product product = createProduct("Exact Stock Product", "15.00", "USD", 5, 5003L);

        Order order = createOrder(userId, "75.00", "USD");
        createOrderItem(order, product, 5);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(updatedProduct.getStock()).isEqualTo(0);
    }

    @Test
    void cancellationOfConfirmedOrderRestoresStock() throws Exception {
        Long userId = uniqueId();
        Product product = createProduct("Restoration Product", "10.00", "USD", 10, 5004L);

        Order order = createOrder(userId, "40.00", "USD");
        createOrderItem(order, product, 4);

        // Pay order
        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk());

        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(6);

        // Cancel order
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Stock restored back to 10
        assertThat(productRepository.findById(product.getId()).orElseThrow().getStock()).isEqualTo(10);
    }

    @Test
    void multiSellerMultiProductStockDeductionAndRestoration() throws Exception {
        Long userId = uniqueId();
        Product pA = createProduct("Multi Product A", "10.00", "USD", 8, 6001L);
        Product pB = createProduct("Multi Product B", "20.00", "USD", 12, 6002L);

        Order order = createOrder(userId, "70.00", "USD");
        createOrderItem(order, pA, 3);
        createOrderItem(order, pB, 2);

        // Pay
        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk());

        assertThat(productRepository.findById(pA.getId()).orElseThrow().getStock()).isEqualTo(5);
        assertThat(productRepository.findById(pB.getId()).orElseThrow().getStock()).isEqualTo(10);

        // Cancel
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk());

        assertThat(productRepository.findById(pA.getId()).orElseThrow().getStock()).isEqualTo(8);
        assertThat(productRepository.findById(pB.getId()).orElseThrow().getStock()).isEqualTo(12);
    }

    @Test
    void concurrentStockUpdatesPreventOverselling() throws Exception {
        Product product = createProduct("Concurrent Product", "10.00", "USD", 5, 7001L);

        int numberOfThreads = 5;
        int qtyPerOrder = 2; // Total requested = 10, Available = 5. At most 2 orders can succeed.

        List<Order> orders = new ArrayList<>();
        List<Long> userIds = new ArrayList<>();
        for (int i = 0; i < numberOfThreads; i++) {
            Long uid = uniqueId();
            userIds.add(uid);
            Order o = createOrder(uid, "20.00", "USD");
            createOrderItem(o, product, qtyPerOrder);
            orders.add(o);
        }

        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(numberOfThreads);
        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger failureCount = new AtomicInteger();

        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executor.submit(() -> {
                try {
                    startLatch.await();
                    var result = mockMvc.perform(post("/api/orders/" + orders.get(index).getId() + "/payment")
                                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userIds.get(index), "CUSTOMER")))
                            .andReturn();
                    if (result.getResponse().getStatus() == 200) {
                        successCount.incrementAndGet();
                    } else {
                        failureCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        endLatch.await();
        executor.shutdown();

        assertThat(successCount.get()).isEqualTo(2);
        assertThat(failureCount.get()).isEqualTo(3);

        Product finalProduct = productRepository.findById(product.getId()).orElseThrow();
        assertThat(finalProduct.getStock()).isEqualTo(1); // 5 - (2 * 2) = 1
    }

    private Order createOrder(Long userId, String totalAmount, String currency) {
        return orderRepository.save(new Order(userId, OrderStatus.PENDING, new BigDecimal(totalAmount), currency));
    }

    private OrderItem createOrderItem(Order order, Product product, int quantity) {
        BigDecimal lineTotal = product.getPriceAmount().multiply(BigDecimal.valueOf(quantity));
        return orderItemRepository.save(new OrderItem(
                order,
                product.getId(),
                product.getSellerId(),
                product.getSku(),
                product.getName(),
                product.getPriceAmount(),
                product.getPriceCurrency(),
                quantity,
                lineTotal
        ));
    }

    private Product createProduct(String namePrefix, String price, String currency, int stock, Long sellerId) {
        String suffix = UUID.randomUUID().toString();
        Category category = categoryRepository.save(new Category("Inventory Category " + suffix, "inventory-category-" + suffix, null, null));
        return productRepository.save(new Product(
                namePrefix + " " + suffix,
                "inventory-product-" + suffix,
                "Description",
                new BigDecimal(price),
                currency,
                "INV-SKU-" + suffix,
                stock,
                sellerId,
                category
        ));
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }
}
