package com.shopsphere.order;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.payment.domain.Payment;
import com.shopsphere.payment.domain.PaymentStatus;
import com.shopsphere.payment.repository.PaymentRepository;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.security.JwtService;
import com.shopsphere.shipping.domain.Shipping;
import com.shopsphere.shipping.domain.ShippingStatus;
import com.shopsphere.shipping.repository.ShippingRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderFulfillmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ShippingRepository shippingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private JwtService jwtService;

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Order createTestOrder(Long customerId, Long sellerId, OrderStatus status) {
        String suffix = UUID.randomUUID().toString();
        Category cat = categoryRepository.save(new Category("Cat " + suffix, "cat-" + suffix, null, null));
        Product product = productRepository.save(new Product("Widget " + suffix, "widget-" + suffix, "Desc", new BigDecimal("99.99"), "USD", "SKU-" + suffix, 100, sellerId, cat));

        Order order = new Order(customerId, status, new BigDecimal("99.99"), "USD");
        order = orderRepository.save(order);
        OrderItem item = new OrderItem(order, product.getId(), sellerId, product.getSku(), product.getName(), product.getPriceAmount(), "USD", 1, new BigDecimal("99.99"));
        orderItemRepository.save(item);
        order.getItems().add(item);
        return order;
    }

    @Test
    @DisplayName("Complete Fulfillment Lifecycle: PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED")
    void testCompleteFulfillmentLifecycle() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();
        Long adminId = uniqueId();

        // 1. Order created (PENDING)
        Order order = createTestOrder(customerId, sellerId, OrderStatus.PENDING);

        // Customer Tracking API returns PENDING
        mockMvc.perform(get("/api/orders/" + order.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(customerId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        // 2. Seller approves (CONFIRMED)
        mockMvc.perform(patch("/api/seller/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(sellerId, "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // 3. Seller prepares order (PROCESSING)
        mockMvc.perform(patch("/api/seller/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(sellerId, "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PROCESSING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));

        // 4. Seller ships order (SHIPPED)
        mockMvc.perform(patch("/api/seller/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(sellerId, "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));

        // Verify Order and Shipping state synchronization
        Order shippedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(shippedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);

        Shipping shipping = shippingRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(shipping.getShippingStatus()).isEqualTo(ShippingStatus.SHIPPED);
        assertThat(shipping.getTrackingNumber()).startsWith("SIM-TRACK-");
        assertThat(shipping.getShippedAt()).isNotNull();

        // 5. Admin marks OUT_FOR_DELIVERY
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"));

        Shipping outForDeliveryShipping = shippingRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(outForDeliveryShipping.getShippingStatus()).isEqualTo(ShippingStatus.OUT_FOR_DELIVERY);
        assertThat(outForDeliveryShipping.getTrackingNumber()).isEqualTo(shipping.getTrackingNumber());

        // Customer Tracking API returns OUT_FOR_DELIVERY
        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(customerId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shippingStatus").value("OUT_FOR_DELIVERY"));

        // 6. Admin marks DELIVERED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        Shipping deliveredShipping = shippingRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(deliveredShipping.getShippingStatus()).isEqualTo(ShippingStatus.DELIVERED);
        assertThat(deliveredShipping.getDeliveredAt()).isNotNull();
    }

    @Test
    @DisplayName("Invalid Transitions: PROCESSING -> DELIVERED & SHIPPED -> DELIVERED must fail")
    void testInvalidTransitionsRejection() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();
        Long adminId = uniqueId();

        Order order = createTestOrder(customerId, sellerId, OrderStatus.PROCESSING);

        // PROCESSING -> DELIVERED (invalid)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isBadRequest());

        // Move to SHIPPED
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        // SHIPPED -> DELIVERED (invalid without OUT_FOR_DELIVERY)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Duplicate Transitions: OUT_FOR_DELIVERY -> OUT_FOR_DELIVERY must fail cleanly")
    void testDuplicateTransitionRejection() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();
        Long adminId = uniqueId();

        Order order = createTestOrder(customerId, sellerId, OrderStatus.OUT_FOR_DELIVERY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Authorization: Customer and Unauthorized Seller cannot alter fulfillment status")
    void testAuthorizationGuards() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();
        Long otherSellerId = uniqueId();

        Order order = createTestOrder(customerId, sellerId, OrderStatus.PROCESSING);

        // Customer attempts fulfillment update -> Forbidden
        mockMvc.perform(patch("/api/seller/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(customerId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isForbidden());

        // Unauthorized seller attempts update -> Not Found (does not belong to seller)
        mockMvc.perform(patch("/api/seller/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(otherSellerId, "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Payment Safety: Payment remains SUCCESS and unchanged during shipping/delivery")
    void testPaymentSafety() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();
        Long adminId = uniqueId();

        Order order = createTestOrder(customerId, sellerId, OrderStatus.SHIPPED);
        Payment payment = paymentRepository.save(new Payment(order, order.getTotalAmount(), "USD", "SimulatedPaymentProvider"));
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setTransactionId("TXN-12345");
        paymentRepository.save(payment);

        // Advance order to OUT_FOR_DELIVERY then DELIVERED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());

        // Payment status and transaction ID remain completely unchanged
        Payment reloadedPayment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertThat(reloadedPayment.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
        assertThat(reloadedPayment.getTransactionId()).isEqualTo("TXN-12345");
    }
}
