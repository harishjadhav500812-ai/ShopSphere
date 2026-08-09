package com.shopsphere.product.mapper;

import com.shopsphere.product.domain.Product;
import com.shopsphere.product.dto.ProductResponse;

public final class ProductMapper {

    private ProductMapper() {}

    public static ProductResponse toResponse(Product p, Double averageRating, Integer reviewCount) {
        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getDescription(),
                p.getPrice(),
                p.getPriceCurrency(),
                p.getSku(),
                p.getStock(),
                p.isActive(),
                p.getSellerId(),
                p.getCategory().getId(),
                p.getImageUrl(),
                averageRating,
                reviewCount,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
