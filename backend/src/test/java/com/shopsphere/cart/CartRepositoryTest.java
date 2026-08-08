package com.shopsphere.cart;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.repository.CartRepository;

@SpringBootTest
@ActiveProfiles("test")
class CartRepositoryTest {

    @Autowired
    private CartRepository cartRepository;

    @Test
    void createAndFindActiveCart() {
        Cart c = cartRepository.save(new Cart(555L));
        Optional<Cart> found = cartRepository.findByUserIdAndActiveTrue(555L);
        assertThat(found).isPresent();
        assertThat(found.get().getUserId()).isEqualTo(555L);
    }
}
