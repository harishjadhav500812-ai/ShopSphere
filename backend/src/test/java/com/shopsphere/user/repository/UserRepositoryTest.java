package com.shopsphere.user.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import com.shopsphere.user.domain.Role;
import com.shopsphere.user.domain.User;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void savesAndFindsByEmailIgnoringCase() {
        User saved = userRepository.save(new User(
                "customer@shopsphere.test",
                "hashed-password",
                "Customer One",
                Role.CUSTOMER
        ));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(userRepository.existsByEmailIgnoreCase("Customer@ShopSphere.Test")).isTrue();
        assertThat(userRepository.findByEmailIgnoreCase("CUSTOMER@SHOPSPHERE.TEST"))
                .isPresent()
                .get()
                .extracting(User::getFullName)
                .isEqualTo("Customer One");
    }
}
