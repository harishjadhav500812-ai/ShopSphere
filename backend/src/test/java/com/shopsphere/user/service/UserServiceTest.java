package com.shopsphere.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.dto.RegisterUserRequest;
import com.shopsphere.user.dto.UserResponse;
import com.shopsphere.user.repository.UserRepository;

@SpringBootTest
@ActiveProfiles("test")
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void registerHashesPasswordAndReturnsSafeResponse() {
        UserResponse response = userService.register(new RegisterUserRequest(
                "Seller@ShopSphere.Test",
                "secret-pass",
                "Seller One",
                Role.SELLER
        ));

        assertThat(response.id()).isNotNull();
        assertThat(response.email()).isEqualTo("seller@shopsphere.test");
        assertThat(response.fullName()).isEqualTo("Seller One");
        assertThat(response.role()).isEqualTo(Role.SELLER);
        assertThat(response.createdAt()).isNotNull();

        User stored = userRepository.findById(response.id()).orElseThrow();
        assertThat(stored.getPasswordHash()).isNotEqualTo("secret-pass");
        assertThat(passwordEncoder.matches("secret-pass", stored.getPasswordHash())).isTrue();
    }

    @Test
    void registerRejectsDuplicateEmail() {
        userService.register(new RegisterUserRequest(
                "dup@shopsphere.test",
                "secret-pass",
                "First User",
                Role.CUSTOMER
        ));

        assertThatThrownBy(() -> userService.register(new RegisterUserRequest(
                "DUP@shopsphere.test",
                "secret-pass",
                "Second User",
                Role.CUSTOMER
        )))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email is already registered");
    }

    @Test
    void registerRejectsAdminRole() {
        assertThatThrownBy(() -> userService.register(new RegisterUserRequest(
                "admin@shopsphere.test",
                "secret-pass",
                "Admin User",
                Role.ADMIN
        )))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("ADMIN registration is not allowed");
    }

    @Test
    void getByIdReturnsUserWithoutPassword() {
        UserResponse created = userService.register(new RegisterUserRequest(
                "reader@shopsphere.test",
                "secret-pass",
                "Reader User",
                Role.CUSTOMER
        ));

        UserResponse found = userService.getById(created.id());

        assertThat(found.id()).isEqualTo(created.id());
        assertThat(found.email()).isEqualTo("reader@shopsphere.test");
        assertThat(found.fullName()).isEqualTo("Reader User");
    }

    @Test
    void getByIdThrowsWhenMissing() {
        assertThatThrownBy(() -> userService.getById(999_999L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
    }
}
