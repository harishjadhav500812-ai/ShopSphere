package com.shopsphere.category;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;

@DataJpaTest
@org.springframework.test.context.ActiveProfiles("test")
class CategoryRepositoryTest {

    @Autowired
    private CategoryRepository repository;

    @Test
    void saveAndFindBySlug() {
        Category c = new Category("Electronics", "electronics", "Devices", null);
        Category saved = repository.save(c);

        assertThat(repository.findBySlug("electronics")).isPresent()
                .get()
                .extracting(Category::getId)
                .isEqualTo(saved.getId());
    }
}
