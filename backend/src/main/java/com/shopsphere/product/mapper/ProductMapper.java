package com.shopsphere.product.mapper;

import com.shopsphere.product.domain.Product;
import com.shopsphere.product.dto.ProductResponse;

public final class ProductMapper {

    private ProductMapper() {}

    public static ProductResponse toResponse(Product p) {
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
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
