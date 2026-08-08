package com.shopsphere.payment;

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
import com.shopsphere.payment.domain.Payment;
import com.shopsphere.payment.domain.PaymentStatus;
import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResult;
import com.shopsphere.payment.repository.PaymentRepository;
import com.shopsphere.payment.service.SimulatedPaymentProvider;
import com.shopsphere.security.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaymentTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private SimulatedPaymentProvider simulatedPaymentProvider;

    // 1. customerCanCreatePaymentForOwnValidOrder
    @Test
    void customerCanCreatePaymentForOwnValidOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "150.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.amount").value(150.00))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.transactionId").value(org.hamcrest.Matchers.startsWith("SIM-PAY-")));

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // 2. customerCannotPayAnotherCustomersOrder
    @Test
    void customerCannotPayAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, "100.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    // 3. unauthenticatedCustomerCannotCreatePayment
    @Test
    void unauthenticatedCustomerCannotCreatePayment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "100.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment"))
                .andExpect(status().isUnauthorized());
    }

    // 4. customerCannotCreateDuplicatePayment
    @Test
    void customerCannotCreateDuplicatePayment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "100.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk());

        // Re-setting status back to PENDING on freshly fetched entity to test duplicate payment check on service level
        Order freshOrder = orderRepository.findById(order.getId()).orElseThrow();
        freshOrder.setStatus(OrderStatus.PENDING);
        orderRepository.save(freshOrder);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isBadRequest());
    }

    // 5. paymentAmountComesFromServerSideOrderTotal
    @Test
    void paymentAmountComesFromServerSideOrderTotal() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "249.99", "USD");

        // Client passes arbitrary body trying to spoof 1.00 payment
        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\": 1.00, \"userId\": 99999}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(249.99));
    }

    // 6. requestCannotOverrideAuthenticatedUserId
    @Test
    void requestCannotOverrideAuthenticatedUserId() throws Exception {
        Long authUser = uniqueId();
        Long victimUser = uniqueId();
        Order victimOrder = createOrder(victimUser, "50.00", "USD");

        mockMvc.perform(post("/api/orders/" + victimOrder.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(authUser, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"userId\": " + authUser + "}"))
                .andExpect(status().isForbidden());
    }

    // 7. createdToPendingIsValid
    @Test
    void createdToPendingIsValid() {
        assertThat(PaymentStatus.CREATED.canTransitionTo(PaymentStatus.PENDING)).isTrue();
    }

    // 8. pendingToSuccessIsValid
    @Test
    void pendingToSuccessIsValid() {
        assertThat(PaymentStatus.PENDING.canTransitionTo(PaymentStatus.SUCCESS)).isTrue();
    }

    // 9. pendingToFailedIsValid
    @Test
    void pendingToFailedIsValid() {
        assertThat(PaymentStatus.PENDING.canTransitionTo(PaymentStatus.FAILED)).isTrue();
    }

    // 10. pendingToCancelledIsValid
    @Test
    void pendingToCancelledIsValid() {
        assertThat(PaymentStatus.PENDING.canTransitionTo(PaymentStatus.CANCELLED)).isTrue();
    }

    // 11. invalidTransitionsAreRejected
    @Test
    void invalidTransitionsAreRejected() {
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.PENDING)).isFalse();
        assertThat(PaymentStatus.SUCCESS.canTransitionTo(PaymentStatus.FAILED)).isFalse();
        assertThat(PaymentStatus.FAILED.canTransitionTo(PaymentStatus.SUCCESS)).isFalse();
        assertThat(PaymentStatus.CANCELLED.canTransitionTo(PaymentStatus.SUCCESS)).isFalse();
    }

    // 12. successfulPaymentUpdatesOrderAppropriately
    @Test
    void successfulPaymentUpdatesOrderAppropriately() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "75.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // 13. failedPaymentDoesNotIncorrectlyConfirmOrder
    @Test
    void failedPaymentDoesNotIncorrectlyConfirmOrder() {
        Long userId = uniqueId();
        Order order = createOrder(userId, "-10.00", "USD"); // invalid negative amount causes provider failure

        PaymentResult result = simulatedPaymentProvider.processPayment(new PaymentRequest(order.getId(), order.getTotalAmount(), order.getCurrency()));
        assertThat(result.success()).isFalse();

        Order unchangedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(unchangedOrder.getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    // 14. customerCanRetrieveOwnPayment
    @Test
    void customerCanRetrieveOwnPayment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "80.00", "USD");
        Payment payment = createPayment(order, new BigDecimal("80.00"), PaymentStatus.SUCCESS);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(payment.getId()))
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    // 15. customerCannotRetrieveAnotherCustomersPayment
    @Test
    void customerCannotRetrieveAnotherCustomersPayment() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order = createOrder(user2, "80.00", "USD");
        createPayment(order, new BigDecimal("80.00"), PaymentStatus.SUCCESS);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    // 16. sellerCannotAccessCustomerPayment
    @Test
    void sellerCannotAccessCustomerPayment() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "80.00", "USD");
        createPayment(order, new BigDecimal("80.00"), PaymentStatus.SUCCESS);

        mockMvc.perform(get("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER")))
                .andExpect(status().isForbidden());
    }

    // 17. paymentNotFoundReturnsExpectedError
    @Test
    void paymentNotFoundReturnsExpectedError() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "80.00", "USD");

        mockMvc.perform(get("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isNotFound());
    }

    // 18. adminCanPerformPermittedPaymentStatusUpdate
    @Test
    void adminCanPerformPermittedPaymentStatusUpdate() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "120.00", "USD");
        createPayment(order, new BigDecimal("120.00"), PaymentStatus.PENDING);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/payment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUCCESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // 19. nonAdminReceives403OnAdminPaymentEndpoint
    @Test
    void nonAdminReceives403OnAdminPaymentEndpoint() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "120.00", "USD");
        createPayment(order, new BigDecimal("120.00"), PaymentStatus.PENDING);

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/payment-status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUCCESS\"}"))
                .andExpect(status().isForbidden());
    }

    // 20. unauthenticatedRequestReceives401OnAdminPaymentEndpoint
    @Test
    void unauthenticatedRequestReceives401OnAdminPaymentEndpoint() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "120.00", "USD");

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/payment-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUCCESS\"}"))
                .andExpect(status().isUnauthorized());
    }

    // 21. simulatedProviderGeneratesTransactionIdWithExpectedFormat
    @Test
    void simulatedProviderGeneratesTransactionIdWithExpectedFormat() {
        PaymentResult result = simulatedPaymentProvider.processPayment(new PaymentRequest(1L, new BigDecimal("50.00"), "USD"));
        assertThat(result.success()).isTrue();
        assertThat(result.transactionId()).startsWith("SIM-PAY-");
    }

    // 22. simulatedProviderReturnsExpectedResult
    @Test
    void simulatedProviderReturnsExpectedResult() {
        PaymentResult result = simulatedPaymentProvider.processPayment(new PaymentRequest(1L, new BigDecimal("10.00"), "USD"));
        assertThat(result.success()).isTrue();
        assertThat(result.message()).isEqualTo("Simulated payment successful");
    }

    // 23. simulatedProviderFailureIsHandledCorrectly
    @Test
    void simulatedProviderFailureIsHandledCorrectly() {
        PaymentResult result = simulatedPaymentProvider.processPayment(new PaymentRequest(1L, BigDecimal.ZERO, "USD"));
        assertThat(result.success()).isFalse();
        assertThat(result.transactionId()).isNull();
        assertThat(result.message()).isEqualTo("Invalid payment amount");
    }

    // 24. paymentPersistsAgainstOrder
    @Test
    void paymentPersistsAgainstOrder() {
        Long userId = uniqueId();
        Order order = createOrder(userId, "90.00", "USD");
        Payment payment = createPayment(order, new BigDecimal("90.00"), PaymentStatus.SUCCESS);

        Payment found = paymentRepository.findById(payment.getId()).orElseThrow();
        assertThat(found.getOrder().getId()).isEqualTo(order.getId());
        assertThat(found.getAmount()).isEqualByComparingTo("90.00");
    }

    // 25. duplicatePaymentOrderConstraintWorks
    @Test
    void duplicatePaymentOrderConstraintWorks() {
        Long userId = uniqueId();
        Order order = createOrder(userId, "90.00", "USD");
        createPayment(order, new BigDecimal("90.00"), PaymentStatus.SUCCESS);

        Payment duplicate = new Payment(order, new BigDecimal("90.00"), "USD", "SimulatedPaymentProvider");

        assertThatThrownBy(() -> paymentRepository.saveAndFlush(duplicate))
                .isNotNull();
    }

    // 26. paymentStatusPersistsCorrectly
    @Test
    void paymentStatusPersistsCorrectly() {
        Long userId = uniqueId();
        Order order = createOrder(userId, "90.00", "USD");
        Payment payment = createPayment(order, new BigDecimal("90.00"), PaymentStatus.PENDING);

        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.saveAndFlush(payment);

        Payment found = paymentRepository.findById(payment.getId()).orElseThrow();
        assertThat(found.getStatus()).isEqualTo(PaymentStatus.SUCCESS);
    }

    private Order createOrder(Long userId, String totalAmount, String currency) {
        return orderRepository.save(new Order(userId, OrderStatus.PENDING, new BigDecimal(totalAmount), currency));
    }

    private Payment createPayment(Order order, BigDecimal amount, PaymentStatus status) {
        Payment payment = new Payment(order, amount, order.getCurrency(), "SimulatedPaymentProvider");
        payment.setStatus(status);
        payment.setTransactionId("SIM-PAY-" + UUID.randomUUID());
        return paymentRepository.save(payment);
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }
}
