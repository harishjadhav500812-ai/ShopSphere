package com.shopsphere.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.category.dto.CreateCategoryRequest;
import com.shopsphere.category.dto.UpdateCategoryRequest;
import com.shopsphere.category.service.CategoryService;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.category.domain.Category;

@SpringBootTest
@ActiveProfiles("test")
class CategoryServiceTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void slugifyProducesDeterministicSlug() {
        String slug = CategoryService.slugify(" New & Fancy  Gadgets ");
        assertThat(slug).isEqualTo("new-fancy-gadgets");
    }

    @Test
    @Transactional
    void createAndDuplicateSlugConflict() {
        var req = new CreateCategoryRequest("Books", "All books", null);
        var r1 = categoryService.create(req);
        assertThat(r1.slug()).isEqualTo("books");

        assertThatThrownBy(() -> categoryService.create(req))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    @Transactional
    void parentChildAndDeleteBlocking() {
        var parent = categoryService.create(new CreateCategoryRequest("Parent", null, null));
        var child = categoryService.create(new CreateCategoryRequest("Child", null, parent.id()));

        assertThat(child.parentId()).isEqualTo(parent.id());

        assertThatThrownBy(() -> categoryService.delete(parent.id()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409");
    }

    @Test
    @Transactional
    void preventSelfParentAndCircular() {
        var c = categoryService.create(new CreateCategoryRequest("A", null, null));
        var d = categoryService.create(new CreateCategoryRequest("B", null, c.id()));

        // attempt to set A parent = A
        assertThatThrownBy(() -> categoryService.update(c.id(), new UpdateCategoryRequest("A", null, c.id())))
                .isInstanceOf(ResponseStatusException.class);

        // attempt to create circular: setting A parent = B would create a cycle (B already parent=A)
        assertThatThrownBy(() -> categoryService.update(c.id(), new UpdateCategoryRequest("A", null, d.id())))
                .isInstanceOf(ResponseStatusException.class);
    }
}
