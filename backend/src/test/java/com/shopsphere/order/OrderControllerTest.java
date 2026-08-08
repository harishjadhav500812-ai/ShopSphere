package com.shopsphere.order;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
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
    void sellerReceives403() throws Exception {
        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "SELLER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminReceives403() throws Exception {
        mockMvc.perform(post("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestRejected() throws Exception {
        mockMvc.perform(post("/api/orders"))
                .andExpect(status().isUnauthorized());
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
