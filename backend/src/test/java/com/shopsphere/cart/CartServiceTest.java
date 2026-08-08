package com.shopsphere.cart;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.shopsphere.cart.dto.CreateCartItemRequest;
import com.shopsphere.cart.service.CartService;

@SpringBootTest
@ActiveProfiles("test")
class CartServiceTest {

    @Autowired
    private CartService cartService;

    @Test
    void addingInvalidQuantityFails() {
        assertThatThrownBy(() -> cartService.addItem(888L, new CreateCartItemRequest(1L, 0)))
                .hasMessageContaining("Invalid quantity");
    }

    @Test
    void addingNonExistentProductFails() {
        assertThatThrownBy(() -> cartService.addItem(888L, new CreateCartItemRequest(9999L, 1)))
                .hasMessageContaining("Product not found");
    }
}
