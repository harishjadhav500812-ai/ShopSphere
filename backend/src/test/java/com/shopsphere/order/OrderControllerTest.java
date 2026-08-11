package com.shopsphere.order;

import static org.hamcrest.Matchers.hasSize;

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

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
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
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Test
    void customerCanCreateOrder() throws Exception {
        Long userId = uniqueId();
        Product product = product("Controller Product", "12.50", "USD", 4, 8001L);
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), "USD", 2));

        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalAmount").value(25.00))
                .andExpect(jsonPath("$.currency").value("USD"))
                .andExpect(jsonPath("$.items[0].productId").value(product.getId()))
                .andExpect(jsonPath("$.items[0].sellerId").value(8001))
                .andExpect(jsonPath("$.items[0].sku").value(product.getSku()))
                .andExpect(jsonPath("$.items[0].productName").value(product.getName()))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].lineTotal").value(25.00))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists());
    }

    @Test
    void sellerReceives403OnCreateOrder() throws Exception {
        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminReceives403OnCreateOrder() throws Exception {
        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestRejected() throws Exception {
        mockMvc.perform(post("/api/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCanListOwnOrdersWithPagination() throws Exception {
        Long userId = uniqueId();
        Order order1 = createOrder(userId, "100.00", "USD");
        Order order2 = createOrder(userId, "50.00", "USD");

        // Order belonging to another user
        createOrder(uniqueId(), "75.00", "USD");

        mockMvc.perform(get("/api/orders?page=0&size=10").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].id").isNumber())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.content[0].items").isArray());
    }

    @Test
    void customerCannotSeeAnotherCustomersOrdersInList() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();

        createOrder(user1, "10.00", "USD");
        createOrder(user2, "20.00", "USD");

        mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].totalAmount").value(10.00));
    }

    @Test
    void customerCanRetrieveOwnOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "45.00", "USD");
        Product p = product("Single Item", "45.00", "USD", 5, 9001L);
        createOrderItem(order, p, 1);

        mockMvc.perform(get("/api/orders/" + order.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(order.getId()))
                .andExpect(jsonPath("$.totalAmount").value(45.00))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productId").value(p.getId()));
    }

    @Test
    void customerCannotRetrieveAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order orderOfUser2 = createOrder(user2, "60.00", "USD");

        mockMvc.perform(get("/api/orders/" + orderOfUser2.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerRetrieveNonExistentOrderReturns404() throws Exception {
        Long userId = uniqueId();
        mockMvc.perform(get("/api/orders/99999999").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isNotFound());
    }

    @Test
    void sellerAndAdminForbiddenFromCustomerEndpoints() throws Exception {
        Long sellerId = uniqueId();
        Long adminId = uniqueId();

        mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(sellerId, "SELLER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanListAllPlatformOrders() throws Exception {
        Long adminId = uniqueId();
        Long customer1 = uniqueId();
        Long customer2 = uniqueId();

        Order o1 = createOrder(customer1, "100.00", "USD");
        Order o2 = createOrder(customer2, "200.00", "USD");

        mockMvc.perform(get("/api/admin/orders?page=0&size=50").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    void nonAdminForbiddenFromAdminEndpoint() throws Exception {
        Long customerId = uniqueId();
        Long sellerId = uniqueId();

        mockMvc.perform(get("/api/admin/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(customerId, "CUSTOMER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(sellerId, "SELLER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void sellerCanRetrieveOrdersAndFiltersUnrelatedItemsInMultiSellerOrder() throws Exception {
        Long seller10 = uniqueId();
        Long seller20 = uniqueId();
        Long customerId = uniqueId();

        Product productA = product("Product A", "10.00", "USD", 10, seller10);
        Product productB = product("Product B", "20.00", "USD", 10, seller20);

        // Order #1 has products from both Seller 10 and Seller 20
        Order order1 = createOrder(customerId, "30.00", "USD");
        createOrderItem(order1, productA, 1);
        createOrderItem(order1, productB, 1);

        // Order #2 has product only from Seller 20
        Order order2 = createOrder(customerId, "20.00", "USD");
        createOrderItem(order2, productB, 1);

        // Seller 10 calls GET /api/seller/orders
        mockMvc.perform(get("/api/seller/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(seller10, "SELLER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].id").value(order1.getId()))
                .andExpect(jsonPath("$.content[0].items", hasSize(1)))
                .andExpect(jsonPath("$.content[0].items[0].productId").value(productA.getId()))
                .andExpect(jsonPath("$.content[0].items[0].sellerId").value(seller10));

        // Seller 20 calls GET /api/seller/orders -> gets both order1 and order2, but order1 items contain only productB
        mockMvc.perform(get("/api/seller/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(seller20, "SELLER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)));
    }

    @Test
    void nonSellerForbiddenFromSellerEndpoint() throws Exception {
        Long customerId = uniqueId();
        Long adminId = uniqueId();

        mockMvc.perform(get("/api/seller/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(customerId, "CUSTOMER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/seller/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void errorResponseShapeUsesExistingConvention() throws Exception {
        Long userId = uniqueId();

        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Active cart not found"))
                .andExpect(jsonPath("$.path").value("/api/orders"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void customerCanPayOwnPendingOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "50.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(order.getId()))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }

    @Test
    void customerCannotPayAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order2 = createOrder(user2, "50.00", "USD");

        mockMvc.perform(post("/api/orders/" + order2.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotPayAlreadyConfirmedOrCancelledOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "50.00", "USD");
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonCustomerAndUnauthenticatedCannotPayOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "50.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/orders/" + order.getId() + "/payment"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCanCancelOwnPendingOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "30.00", "USD");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(order.getId()))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void customerCannotCancelAnotherCustomersOrder() throws Exception {
        Long user1 = uniqueId();
        Long user2 = uniqueId();
        Order order2 = createOrder(user2, "30.00", "USD");

        mockMvc.perform(post("/api/orders/" + order2.getId() + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(user1, "CUSTOMER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotCancelDeliveredOrder() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "30.00", "USD");
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminCanPerformValidStatusTransitions() throws Exception {
        Long adminId = uniqueId();
        Order order = createOrder(uniqueId(), "100.00", "USD");

        // PENDING -> CONFIRMED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // CONFIRMED -> PROCESSING
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PROCESSING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));

        // PROCESSING -> SHIPPED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));

        // SHIPPED -> OUT_FOR_DELIVERY
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_FOR_DELIVERY"));

        // OUT_FOR_DELIVERY -> DELIVERED
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    @Test
    void adminCannotPerformInvalidStatusTransitions() throws Exception {
        Long adminId = uniqueId();
        Order order = createOrder(uniqueId(), "100.00", "USD");

        // PENDING -> SHIPPED (invalid)
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SHIPPED\"}"))
                .andExpect(status().isBadRequest());

        // SHIPPED -> DELIVERED (invalid, must pass through OUT_FOR_DELIVERY)
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(adminId, "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonAdminCannotAccessAdminStatusPatchEndpoint() throws Exception {
        Long userId = uniqueId();
        Order order = createOrder(userId, "100.00", "USD");

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isUnauthorized());
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

    private Product product(String namePrefix, String price, String currency, int stock, Long sellerId) {
        String suffix = UUID.randomUUID().toString();
        Category category = categoryRepository.save(new Category("Order Controller Category " + suffix, "order-controller-category-" + suffix, null, null));
        return productRepository.save(new Product(
                namePrefix + " " + suffix,
                "order-controller-product-" + suffix,
                "Description",
                new BigDecimal(price),
                currency,
                "ORDER-CONTROLLER-SKU-" + suffix,
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
