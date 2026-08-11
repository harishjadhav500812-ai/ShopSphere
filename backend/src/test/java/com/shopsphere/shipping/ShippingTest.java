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
class ShippingTest {

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

    // 1. customerCanCreateShipmentForOwnConfirmedOrder
    @Test
    void customerCanCreateShipmentForOwnConfirmedOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.shippingStatus").value("READY"))
                .andExpect(jsonPath("$.trackingNumber").isNotEmpty())
                .andExpect(jsonPath("$.shippingAddress.recipientName").value("John Doe"));

        // Order status should advance to PROCESSING
        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.PROCESSING);
    }

    // 2. customerCannotCreateShipmentForAnotherCustomersOrder
    @Test
    void customerCannotCreateShipmentForAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isForbidden());
    }

    // 3. customerCannotCreateShipmentForCancelledOrder
    @Test
    void customerCannotCreateShipmentForCancelledOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CANCELLED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isBadRequest());
    }

    // 4. customerCannotCreateDuplicateShipment
    @Test
    void customerCannotCreateDuplicateShipment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isBadRequest());
    }

    // 5. unauthenticatedCannotCreateShipment
    @Test
    void unauthenticatedCannotCreateShipment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/shipping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isUnauthorized());
    }

    // 6. customerCanTrackOwnOrder
    @Test
    void customerCanTrackOwnOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        Shipping shipping = createShipping(order, validAddress());

        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.shippingStatus").value("READY"))
                .andExpect(jsonPath("$.trackingNumber").value(shipping.getTrackingNumber()));
    }

    // 7. customerCannotTrackAnotherCustomersOrder
    @Test
    void customerCannotTrackAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, OrderStatus.CONFIRMED);
        createShipping(order, validAddress());

        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    // 8. trackingForOrderWithoutShipmentReturnsExpectedError
    @Test
    void trackingForOrderWithoutShipmentReturnsExpectedError() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isNotFound());
    }

    // 9. unauthenticatedCannotTrackOrder
    @Test
    void unauthenticatedCannotTrackOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking"))
                .andExpect(status().isUnauthorized());
    }

    // 10. adminCanUpdateShippingStatus
    @Test
    void adminCanUpdateShippingStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, validAddress());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipping-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonStatusRequest(ShippingStatus.SHIPPED)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shippingStatus").value("SHIPPED"));

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.SHIPPED);
    }

    // 11. nonAdminCannotUpdateShippingStatus
    @Test
    void nonAdminCannotUpdateShippingStatus() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, validAddress());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipping-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonStatusRequest(ShippingStatus.SHIPPED)))
                .andExpect(status().isForbidden());
    }

    // 12. invalidShippingStatusTransitionIsRejected
    @Test
    void invalidShippingStatusTransitionIsRejected() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PROCESSING);
        createShipping(order, validAddress()); // initial status: READY

        // READY -> DELIVERED is invalid (must go READY -> SHIPPED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipping-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonStatusRequest(ShippingStatus.DELIVERED)))
                .andExpect(status().isBadRequest());
    }

    // 13. deliveryUpdatesOrderToDelivered
    @Test
    void deliveryUpdatesOrderToDelivered() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.OUT_FOR_DELIVERY);
        Shipping shipping = createShipping(order, validAddress());
        shipping.setShippingStatus(ShippingStatus.OUT_FOR_DELIVERY);
        shippingRepository.save(shipping);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipping-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonStatusRequest(ShippingStatus.DELIVERED)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shippingStatus").value("DELIVERED"));

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);
    }

    // 14. shippingCannotMakeInvalidOrderTransition
    @Test
    void shippingCannotMakeInvalidOrderTransition() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.PENDING); // PENDING order cannot directly transition to SHIPPED
        createShipping(order, validAddress());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/shipping-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonStatusRequest(ShippingStatus.SHIPPED)))
                .andExpect(status().isOk());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        // Order remains PENDING because PENDING -> SHIPPED is invalid
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    // 15. sellerCannotAccessCustomerShippingDataUnlessExplicitlyAllowed
    @Test
    void sellerCannotAccessCustomerShippingDataUnlessExplicitlyAllowed() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        createShipping(order, validAddress());

        mockMvc.perform(get("/api/orders/" + order.getId() + "/tracking")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER")))
                .andExpect(status().isForbidden());
    }

    // 16. requestCannotOverrideAuthenticatedUserId
    @Test
    void requestCannotOverrideAuthenticatedUserId() throws Exception {
        Long authUserId = uniqueId();
        Long victimUserId = uniqueId();
        Order victimOrder = createOrder(victimUserId, OrderStatus.CONFIRMED);

        // Authenticated as authUserId, attempting to access victimOrder
        mockMvc.perform(post("/api/orders/" + victimOrder.getId() + "/shipping")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(authUserId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAddressRequest()))
                .andExpect(status().isForbidden());
    }

    // 17. simulatedShippingProviderCreatesTrackingNumber
    @Test
    void simulatedShippingProviderCreatesTrackingNumber() {
        ShipmentRequest request = new ShipmentRequest(100L, validAddress());
        ShipmentResult result = simulatedShippingProvider.createShipment(request);

        assertThat(result.success()).isTrue();
        assertThat(result.trackingNumber()).startsWith("SIM-TRACK-");
        assertThat(result.carrier()).isEqualTo("SimulatedExpress");
    }

    // 18. simulatedShippingProviderReturnsExpectedResult
    @Test
    void simulatedShippingProviderReturnsExpectedResult() {
        ShipmentResult result = simulatedShippingProvider.createShipment(null);
        assertThat(result.success()).isFalse();
        assertThat(result.message()).isEqualTo("Invalid shipment request");
    }

    // 19. shipmentPersistsAgainstOrder
    @Test
    void shipmentPersistsAgainstOrder() {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        Shipping shipping = createShipping(order, validAddress());

        Shipping persisted = shippingRepository.findById(shipping.getId()).orElseThrow();
        assertThat(persisted.getOrder().getId()).isEqualTo(order.getId());
        assertThat(persisted.getRecipientName()).isEqualTo("John Doe");
        assertThat(persisted.getTrackingNumber()).isEqualTo(shipping.getTrackingNumber());
    }

    // 20. orderCannotHaveDuplicateShipment
    @Test
    void orderCannotHaveDuplicateShipment() {
        Long userId = uniqueId();
        Order order = createOrder(userId, OrderStatus.CONFIRMED);
        createShipping(order, validAddress());

        Shipping duplicate = new Shipping(
                order, "Jane Doe", "9876543210", "456 Oak St", null,
                "Metropolis", "NY", "10002", "USA", "SIM-TRACK-" + UUID.randomUUID(), "SimulatedExpress"
        );

        assertThatThrownBy(() -> shippingRepository.saveAndFlush(duplicate))
                .isNotNull();
    }

    private Order createOrder(Long userId, OrderStatus status) {
        return orderRepository.save(new Order(userId, status, new BigDecimal("100.00"), "USD"));
    }

    private Shipping createShipping(Order order, ShippingAddressDto addr) {
        Shipping shipping = new Shipping(
                order,
                addr.recipientName(),
                addr.phone(),
                addr.addressLine1(),
                addr.addressLine2(),
                addr.city(),
                addr.state(),
                addr.postalCode(),
                addr.country(),
                "SIM-TRACK-" + UUID.randomUUID(),
                "SimulatedExpress"
        );
        return shippingRepository.save(shipping);
    }

    private ShippingAddressDto validAddress() {
        return new ShippingAddressDto(
                "John Doe",
                "1234567890",
                "123 Main St",
                "Apt 4B",
                "Springfield",
                "IL",
                "62701",
                "USA"
        );
    }

    private String jsonAddressRequest() {
        return """
        {
          "shippingAddress": {
            "recipientName": "John Doe",
            "phone": "1234567890",
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

    private String jsonStatusRequest(ShippingStatus status) {
        return "{\"status\":\"" + status.name() + "\"}";
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }
}
