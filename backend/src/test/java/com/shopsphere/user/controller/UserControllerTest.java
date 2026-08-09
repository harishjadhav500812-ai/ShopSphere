package com.shopsphere.user.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.common.exception.GlobalExceptionHandler;
import com.shopsphere.user.domain.Role;
import com.shopsphere.user.dto.RegisterResponse;
import com.shopsphere.user.dto.RegisterUserRequest;
import com.shopsphere.user.dto.UserResponse;
import com.shopsphere.user.service.UserService;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void registerReturnsCreatedUser() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(
                new RegisterResponse(
                        new UserResponse(1L, "customer@shopsphere.test", "Customer One", Role.CUSTOMER, Instant.parse("2026-01-01T00:00:00Z")),
                        true,
                        false,
                        "123456"
                )
        );

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "customer@shopsphere.test",
                                  "password": "secret-pass",
                                  "fullName": "Customer One",
                                  "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").value(1))
                .andExpect(jsonPath("$.user.email").value("customer@shopsphere.test"))
                .andExpect(jsonPath("$.user.fullName").value("Customer One"))
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.verificationRequired").value(true))
                .andExpect(jsonPath("$.devVerificationCode").value("123456"))
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void registerReturnsValidationErrorForBlankEmail() throws Exception {
        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "",
                                  "password": "secret-pass",
                                  "fullName": "Customer One",
                                  "role": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
    }

    @Test
    void getByIdReturnsUser() throws Exception {
        when(userService.getById(eq(5L))).thenReturn(
                new UserResponse(5L, "seller@shopsphere.test", "Seller One", Role.SELLER, Instant.parse("2026-01-02T00:00:00Z"))
        );

        mockMvc.perform(get("/api/users/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.email").value("seller@shopsphere.test"))
                .andExpect(jsonPath("$.role").value("SELLER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void getByIdReturnsNotFound() throws Exception {
        when(userService.getById(eq(42L)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        mockMvc.perform(get("/api/users/42"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }
}
