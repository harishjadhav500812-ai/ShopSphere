package com.shopsphere.product;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.product.dto.CreateProductRequest;
import com.shopsphere.product.dto.UpdateProductRequest;
import com.shopsphere.product.dto.UpdateProductStatusRequest;
import com.shopsphere.product.dto.UpdateProductStockRequest;
import com.shopsphere.security.JwtService;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CategoryRepository categoryRepository;

    private String sellerToken() {
        return jwtService.createAccessToken("seller.user@shopsphere.test", 555L, "SELLER", 60);
    }

    private String otherSellerToken() {
        return jwtService.createAccessToken("other.seller@shopsphere.test", 556L, "SELLER", 60);
    }

    private String adminToken() {
        return jwtService.createAccessToken("admin@shopsphere.test", 1L, "ADMIN", 60);
    }

    private String customerToken() {
        return jwtService.createAccessToken("cust.user@shopsphere.test", 888L, "CUSTOMER", 60);
    }

    private Long categoryId() {
        String suffix = UUID.randomUUID().toString();
        Category category = categoryRepository.save(new Category("Category " + suffix, "category-" + suffix, null, null));
        return category.getId();
    }

    private CreateProductRequest createRequest(String name, Long categoryId) {
        return new CreateProductRequest(name, "Description", new BigDecimal("19.99"), "USD", "SKU-" + UUID.randomUUID(), 10, categoryId, null);
    }

    private UpdateProductRequest updateRequest(String name, Long categoryId) {
        return new UpdateProductRequest(name, "Updated description", new BigDecimal("29.99"), "USD", "SKU-" + UUID.randomUUID(), 12, categoryId, null);
    }

    private long createProduct(String token, String name, Long categoryId) throws Exception {
        String body = objectMapper.writeValueAsString(createRequest(name, categoryId));
        var mvc = mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(mvc.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void publicGetProducts() throws Exception {
        mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk());
    }

    @Test
    void sellerCreateAndGetById() throws Exception {
        Long categoryId = categoryId();
        var req = createRequest("Gizmo " + UUID.randomUUID(), categoryId);
        String body = objectMapper.writeValueAsString(req);
        String token = sellerToken();

        var mvc = mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.categoryId").value(categoryId))
                .andExpect(jsonPath("$.stock").value(10))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn();

        String response = mvc.getResponse().getContentAsString();
        var node = objectMapper.readTree(response);
        long id = node.get("id").asLong();

        mockMvc.perform(get("/api/products/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void createProductWithNonexistentCategoryReturns404() throws Exception {
        var req = createRequest("Missing Category " + UUID.randomUUID(), 999999L);

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken())
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void customerCannotCreate() throws Exception {
        var req = createRequest("Widget " + UUID.randomUUID(), categoryId());
        String body = objectMapper.writeValueAsString(req);
        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken())
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationRejectsBlankName() throws Exception {
        var req = new CreateProductRequest("  ", "desc", new BigDecimal("3.00"), "USD", null, 1, categoryId(), null);
        String body = objectMapper.writeValueAsString(req);
        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken())
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void duplicateSlugReturns409() throws Exception {
        String token = sellerToken();
        var req = createRequest("Thingamajig " + UUID.randomUUID(), categoryId());
        String body = objectMapper.writeValueAsString(req);
        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void sellerUpdatesOwnProduct() throws Exception {
        Long categoryId = categoryId();
        long id = createProduct(sellerToken(), "Seller Own " + UUID.randomUUID(), categoryId);

        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken())
                        .content(objectMapper.writeValueAsString(updateRequest("Seller Updated " + UUID.randomUUID(), categoryId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.price").value(29.99))
                .andExpect(jsonPath("$.sellerId").value(555));
    }

    @Test
    void sellerCannotUpdateAnotherSellersProduct() throws Exception {
        long id = createProduct(sellerToken(), "Protected " + UUID.randomUUID(), categoryId());

        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherSellerToken())
                        .content(objectMapper.writeValueAsString(updateRequest("Blocked " + UUID.randomUUID(), categoryId()))))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminUpdatesAnotherSellersProduct() throws Exception {
        Long categoryId = categoryId();
        long id = createProduct(sellerToken(), "Admin Editable " + UUID.randomUUID(), categoryId);

        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                        .content(objectMapper.writeValueAsString(updateRequest("Admin Updated " + UUID.randomUUID(), categoryId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerId").value(555));
    }

    @Test
    void sellerChangesOwnProductStatus() throws Exception {
        long id = createProduct(sellerToken(), "Status Own " + UUID.randomUUID(), categoryId());

        mockMvc.perform(patch("/api/products/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken())
                        .content(objectMapper.writeValueAsString(new UpdateProductStatusRequest(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void sellerCannotChangeAnotherSellersStatus() throws Exception {
        long id = createProduct(sellerToken(), "Status Protected " + UUID.randomUUID(), categoryId());

        mockMvc.perform(patch("/api/products/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherSellerToken())
                        .content(objectMapper.writeValueAsString(new UpdateProductStatusRequest(false))))
                .andExpect(status().isForbidden());
    }

    @Test
    void sellerSoftDeletesOwnProduct() throws Exception {
        long id = createProduct(sellerToken(), "Delete Own " + UUID.randomUUID(), categoryId());

        mockMvc.perform(delete("/api/products/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    void sellerCannotDeleteAnotherSellersProduct() throws Exception {
        long id = createProduct(sellerToken(), "Delete Protected " + UUID.randomUUID(), categoryId());

        mockMvc.perform(delete("/api/products/" + id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherSellerToken()))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotWriteProducts() throws Exception {
        long id = createProduct(sellerToken(), "Customer Blocked " + UUID.randomUUID(), categoryId());

        mockMvc.perform(put("/api/products/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken())
                        .content(objectMapper.writeValueAsString(updateRequest("Customer Update " + UUID.randomUUID(), categoryId()))))
                .andExpect(status().isForbidden());
    }

    @Test
    void stockUpdateAuthorization() throws Exception {
        long id = createProduct(sellerToken(), "Stock Own " + UUID.randomUUID(), categoryId());

        mockMvc.perform(post("/api/products/" + id + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + otherSellerToken())
                        .content(objectMapper.writeValueAsString(new UpdateProductStockRequest(7))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/products/" + id + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                        .content(objectMapper.writeValueAsString(new UpdateProductStockRequest(7))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock").value(7));
    }

    @Test
    void invalidStockReturns400() throws Exception {
        long id = createProduct(sellerToken(), "Invalid Stock " + UUID.randomUUID(), categoryId());

        mockMvc.perform(post("/api/products/" + id + "/stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + sellerToken())
                        .content(objectMapper.writeValueAsString(new UpdateProductStockRequest(-1))))
                .andExpect(status().isBadRequest());
    }
}
