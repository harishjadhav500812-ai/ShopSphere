package com.shopsphere.product;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

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

    private String sellerToken() {
        return jwtService.createAccessToken("seller.user@shopsphere.test", 555L, "SELLER", 60);
    }

    private String customerToken() {
        return jwtService.createAccessToken("cust.user@shopsphere.test", 888L, "CUSTOMER", 60);
    }

    @Test
    void publicGetProducts() throws Exception {
        mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON)).andExpect(status().isOk());
    }

    @Test
    void sellerCreateAndGetById() throws Exception {
        var req = new com.shopsphere.product.dto.CreateProductRequest("Gizmo", "Cool gadget", new BigDecimal("19.99"));
        String body = objectMapper.writeValueAsString(req);
        String token = sellerToken();

        var mvc = mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("gizmo"))
                .andReturn();

        String response = mvc.getResponse().getContentAsString();
        var node = objectMapper.readTree(response);
        long id = node.get("id").asLong();

        mockMvc.perform(get("/api/products/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void customerCannotCreate() throws Exception {
        var req = new com.shopsphere.product.dto.CreateProductRequest("Widget", "Desc", new BigDecimal("9.99"));
        String body = objectMapper.writeValueAsString(req);
        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken())
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationRejectsBlankName() throws Exception {
        var req = new com.shopsphere.product.dto.CreateProductRequest("  ", "desc", new BigDecimal("3.00"));
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
        var req = new com.shopsphere.product.dto.CreateProductRequest("Thingamajig", null, new BigDecimal("5.00"));
        String body = objectMapper.writeValueAsString(req);
        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isConflict());
    }
}
