package com.shopsphere.category;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    private String adminToken() {
        return jwtService.createAccessToken("admin.user@shopsphere.test", 999L, "ADMIN", 60);
    }

    private String customerToken() {
        return jwtService.createAccessToken("cust.user@shopsphere.test", 888L, "CUSTOMER", 60);
    }

    @Test
    void publicGetCategories() throws Exception {
        mockMvc.perform(get("/api/categories").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void adminCreateAndGetById() throws Exception {
        String body = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("Gadgets", "Cool stuff", null));

        String token = adminToken();

        var mvc = mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("gadgets"))
                .andReturn();

        String response = mvc.getResponse().getContentAsString();
        var node = objectMapper.readTree(response);
        long id = node.get("id").asLong();

        mockMvc.perform(get("/api/categories/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
    }

    @Test
    void customerCannotCreate() throws Exception {
        String body = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("Toys", "Fun", null));
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + customerToken())
                        .content(body))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationRejectsBlankName() throws Exception {
        String body = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("  ", "desc", null));
        mockMvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken())
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void duplicateSlugReturns409() throws Exception {
        String token = adminToken();
        String body = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("Housewares", null, null));
        mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteBlockedWhenChildrenExist() throws Exception {
        String token = adminToken();
        String parentBody = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("ParentX", null, null));
        var parentMvc = mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(parentBody))
                .andExpect(status().isCreated())
                .andReturn();
        long parentId = objectMapper.readTree(parentMvc.getResponse().getContentAsString()).get("id").asLong();

        String childBody = objectMapper.writeValueAsString(new com.shopsphere.category.dto.CreateCategoryRequest("ChildX", null, parentId));
        mockMvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).content(childBody))
                .andExpect(status().isCreated());

        mockMvc.perform(delete("/api/categories/" + parentId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isConflict());
    }

}
