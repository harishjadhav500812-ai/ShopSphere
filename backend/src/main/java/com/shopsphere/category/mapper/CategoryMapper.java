package com.shopsphere.category.mapper;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.dto.CategoryResponse;

public final class CategoryMapper {

    private CategoryMapper() {}

    public static CategoryResponse toResponse(Category c) {
        Long parentId = c.getParent() != null ? c.getParent().getId() : null;
        return new CategoryResponse(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getDescription(),
                parentId,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
