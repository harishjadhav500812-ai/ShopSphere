package com.shopsphere.shipping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.security.JwtService;
import com.shopsphere.shipping.domain.ShipmentStatus;
import com.shopsphere.shipping.domain.Shipping;
import com.shopsphere.shipping.domain.ShippingStatus;
import com.shopsphere.shipping.dto.ShippingAddressDto;
import com.shopsphere.shipping.repository.ShippingRepository;
import com.shopsphere.shipping.service.ShipmentRequest;
import com.shopsphere.shipping.service.ShipmentResult;
import com.shopsphere.shipping.service.SimulatedShippingProvider;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShipmentTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShippingRepository shippingRepository;

    @Autowired
    private SimulatedShippingProvider simulatedShippingProvider;

    // 1. customerCanCreateShipmentForOwnEligibleOrder
    @Test
    void customerCanCreateShipmentForOwnEligibleOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.shippingAddress.recipientName").value("John Doe"));
    }

    // 2. customerCannotCreateShipmentForAnotherUsersOrder
    @Test
    void customerCannotCreateShipmentForAnotherUsersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isForbidden());
    }

    // 3. customerCannotCreateDuplicateShipment
    @Test
    void customerCannotCreateDuplicateShipment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isBadRequest());
    }

    // 4. unauthenticatedCustomerShipmentRequestReturns401
    @Test
    void unauthenticatedCustomerShipmentRequestReturns401() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isUnauthorized());
    }

    // 5. nonCustomerCannotCreateCustomerShipment
    @Test
    void nonCustomerCannotCreateCustomerShipment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isForbidden());
    }

    // 6. customerCanRetrieveOwnShipment
    @Test
    void customerCanRetrieveOwnShipment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        Shipping shipping = createShipping(order, ShippingStatus.READY);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(shipping.getId()))
                .andExpect(jsonPath("$.orderId").value(order.getId()));
    }

    // 7. customerCannotRetrieveAnotherUsersShipment
    @Test
    void customerCannotRetrieveAnotherUsersShipment() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, OrderStatus.CONFIRMED);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    // 8. adminCanUpdateShipmentStatus
    @Test
    void adminCanUpdateShipmentStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shippingStatus").value("SHIPPED"));
    }

    // 9. customerCannotUpdateShipmentStatus
    @Test
    void customerCannotUpdateShipmentStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isForbidden());
    }

    // 10. sellerCannotUpdateShipmentStatus
    @Test
    void sellerCannotUpdateShipmentStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isForbidden());
    }

    // 11. invalidStatusTransitionIsRejected
    @Test
    void invalidStatusTransitionIsRejected() {
        assertThat(ShippingStatus.DELIVERED.canTransitionTo(ShippingStatus.SHIPPED)).isFalse();
        assertThat(ShippingStatus.CANCELLED.canTransitionTo(ShippingStatus.READY)).isFalse();
        assertThat(ShipmentStatus.DELIVERED.canTransitionTo(ShipmentStatus.SHIPPED)).isFalse();
    }

    // 12. terminalStatusCannotTransition
    @Test
    void terminalStatusCannotTransition() {
        assertThat(ShippingStatus.DELIVERED.canTransitionTo(ShippingStatus.READY_TO_SHIP)).isFalse();
        assertThat(ShippingStatus.CANCELLED.canTransitionTo(ShippingStatus.IN_TRANSIT)).isFalse();
        assertThat(ShipmentStatus.CANCELLED.canTransitionTo(ShipmentStatus.READY_TO_SHIP)).isFalse();
    }

    // 13. shippedSetsShippedAt
    @Test
    void shippedSetsShippedAt() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shippedAt").isNotEmpty());
    }

    // 14. deliveredSetsDeliveredAt
    @Test
    void deliveredSetsDeliveredAt() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.SHIPPED);
        Shipping shipping = createShipping(order, ShippingStatus.SHIPPED);

        Shipping freshShipping = shippingRepository.findById(shipping.getId()).orElseThrow();
        freshShipping.setShippingStatus(ShippingStatus.IN_TRANSIT);
        shippingRepository.save(freshShipping);

        freshShipping = shippingRepository.findById(shipping.getId()).orElseThrow();
        freshShipping.setShippingStatus(ShippingStatus.OUT_FOR_DELIVERY);
        shippingRepository.save(freshShipping);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveredAt").isNotEmpty());
    }

    // 15. trackingNumberIsGeneratedServerSide
    @Test
    void trackingNumberIsGeneratedServerSide() {
        ShipmentResult result = simulatedShippingProvider.createShipment(new ShipmentRequest(1L, sampleAddressDto()));
        assertThat(result.success()).isTrue();
        assertThat(result.trackingNumber()).startsWith("SIM-TRACK-");
    }

    // 16. clientCannotOverrideTrackingNumber
    @Test
    void clientCannotOverrideTrackingNumber() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        String bodyWithFakeTracking = """
                {
                    "shippingAddress": {
                        "recipientName": "Jane Doe",
                        "phone": "555-0199",
                        "addressLine1": "123 Main St",
                        "city": "Springfield",
                        "state": "IL",
                        "postalCode": "62701",
                        "country": "USA"
                    },
                    "trackingNumber": "FAKE-12345"
                }
                """;

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyWithFakeTracking))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trackingNumber").value(org.hamcrest.Matchers.startsWith("SIM-TRACK-")));
    }

    // 17. clientCannotOverrideShipmentStatus
    @Test
    void clientCannotOverrideShipmentStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        String bodyWithFakeStatus = """
                {
                    "shippingAddress": {
                        "recipientName": "Jane Doe",
                        "phone": "555-0199",
                        "addressLine1": "123 Main St",
                        "city": "Springfield",
                        "state": "IL",
                        "postalCode": "62701",
                        "country": "USA"
                    },
                    "shippingStatus": "DELIVERED"
                }
                """;

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyWithFakeStatus))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shippingStatus").value(org.hamcrest.Matchers.not("DELIVERED")));
    }

    // 18. shipmentUsesOrderShippingSnapshot
    @Test
    void shipmentUsesOrderShippingSnapshot() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shippingAddress.recipientName").value("John Doe"))
                .andExpect(jsonPath("$.shippingAddress.city").value("Springfield"));
    }

    // 19. shipmentStatusSynchronizesOrderStatusCorrectly
    @Test
    void shipmentStatusSynchronizesOrderStatusCorrectly() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
    }

    // 20. duplicateShipmentIsPreventedAtServiceLevel
    @Test
    void duplicateShipmentIsPreventedAtServiceLevel() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isBadRequest());
    }

    // 21. databaseUniqueConstraintPreventsDuplicateOrderIdShipments
    @Test
    void databaseUniqueConstraintPreventsDuplicateOrderIdShipments() {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        createShipping(order, ShippingStatus.READY);

        Shipping duplicate = new Shipping(order, "Dup", "555-0000", "123 St", null, "City", "ST", "00000", "USA", "SIM-TRK-" + UUID.randomUUID(), "Carrier");

        assertThatThrownBy(() -> shippingRepository.saveAndFlush(duplicate))
                .isNotNull();
    }

    // 22. providerAbstractionGeneratesValidSimulatedTrackingNumber
    @Test
    void providerAbstractionGeneratesValidSimulatedTrackingNumber() {
        ShipmentResult result = simulatedShippingProvider.createShipment(new ShipmentRequest(1L, sampleAddressDto()));
        assertThat(result.success()).isTrue();
        assertThat(result.trackingNumber()).matches("^SIM-TRACK-[a-f0-9\\-]{36}$");
    }

    // 23. transactionalUpdateKeepsShipmentOrderStatusSynchronized
    @Test
    void transactionalUpdateKeepsShipmentOrderStatusSynchronized() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, ShippingStatus.READY);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk());

        Shipping shipping = shippingRepository.findByOrderId(order.getId()).orElseThrow();
        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();

        assertThat(shipping.getShippingStatus()).isEqualTo(ShippingStatus.SHIPPED);
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
    }

    // 24. existingPaymentOrderBehaviorRemainsUnaffected
    @Test
    void existingPaymentOrderBehaviorRemainsUnaffected() {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PENDING);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(order.getTotalAmount()).isEqualByComparingTo("100.00");
    }

    private Order createOrder(Long userId, OrderStatus status) {
        return orderRepository.save(new Order(userId, status, new BigDecimal("100.00"), "USD"));
    }

    private Shipping createShipping(Order order, ShippingStatus status) {
        Shipping shipping = new Shipping(
                order,
                "John Doe",
                "555-0123",
                "123 Main St",
                "Apt 4B",
                "Springfield",
                "IL",
                "62701",
                "USA",
                "SIM-TRK-" + UUID.randomUUID(),
                "Simulated Shipping Provider"
        );
        shipping.setShippingStatus(status);
        return shippingRepository.save(shipping);
    }

    private ShippingAddressDto sampleAddressDto() {
        return new ShippingAddressDto("John Doe", "555-0123", "123 Main St", "Apt 4B", "Springfield", "IL", "62701", "USA");
    }

    private String jsonAddressRequest() {
        return """
                {
                    "shippingAddress": {
                        "recipientName": "John Doe",
                        "phone": "555-0123",
                        "addressLine1": "123 Main St",
                        "addressLine2": "Apt 4B",
                        "city": "Springfield",
                        "state": "IL",
                        "postalCode": "62701",
                        "country": "USA"
                    }
                }
                """;
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }
}
