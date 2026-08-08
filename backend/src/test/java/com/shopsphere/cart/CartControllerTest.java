package com.shopsphere.cart;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.security.JwtService;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CategoryRepository categoryRepository;

    private long productId;
    private long customerId;
    private String sellerToken;

    private String customerToken() {
        return jwtService.createAccessToken("cust." + customerId + "@shopsphere.test", customerId, "CUSTOMER", 60);
    }

    private String sellerToken() {
        return jwtService.createAccessToken("seller.user@shopsphere.test", 777L, "SELLER", 60);
    }

    private Long categoryId() {
        String suffix = UUID.randomUUID().toString();
        Category category = categoryRepository.save(new Category("Cart Category " + suffix, "cart-category-" + suffix, null, null));
        return category.getId();
    }

    @BeforeEach
    void setUp() throws Exception {
        customerId = Math.abs(UUID.randomUUID().getMostSignificantBits());
        sellerToken = sellerToken();

        var req = new com.shopsphere.product.dto.CreateProductRequest(
                "Test Product " + UUID.randomUUID(),
                "Test product description",
                new BigDecimal("29.99"),
                "USD",
                "CART-SKU-" + UUID.randomUUID(),
                5,
                categoryId()
        );
        String body = objectMapper.writeValueAsString(req);

        var response = mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken)
                .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String responseStr = response.getResponse().getContentAsString();
        var node = objectMapper.readTree(responseStr);
        productId = node.get("id").asLong();
    }

    @Test
    void customerCartLifecycle() throws Exception {
        String token = customerToken();

        // get empty cart
        mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(0));

        // add item
        String body = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.CreateCartItemRequest(productId, 2));
        mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        // add same product again merges quantity
        String body2 = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.CreateCartItemRequest(productId, 3));
        mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body2))
                .andExpect(status().isCreated());

        // update quantity
        String cartJson = mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var node = objectMapper.readTree(cartJson);
        long itemId = node.get("items").get(0).get("itemId").asLong();

        String update = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.UpdateCartItemRequest(4));
        mockMvc.perform(put("/api/cart/items/" + itemId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity").value(4));

        // remove item
        mockMvc.perform(delete("/api/cart/items/" + itemId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        // seller cannot access
        mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void cartCannotAddQuantityGreaterThanStock() throws Exception {
        String token = customerToken();
        String body = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.CreateCartItemRequest(productId, 6));

        mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Quantity exceeds available stock"));
    }

    @Test
    void cartCannotUpdateQuantityGreaterThanStock() throws Exception {
        String token = customerToken();
        String body = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.CreateCartItemRequest(productId, 2));
        mockMvc.perform(post("/api/cart/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        String cartJson = mockMvc.perform(get("/api/cart").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var node = objectMapper.readTree(cartJson);
        long itemId = node.get("items").get(0).get("itemId").asLong();

        String update = objectMapper.writeValueAsString(new com.shopsphere.cart.dto.UpdateCartItemRequest(6));
        mockMvc.perform(put("/api/cart/items/" + itemId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Quantity exceeds available stock"));
    }
}
