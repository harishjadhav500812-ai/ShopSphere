package com.shopsphere.product.dto;

import java.math.BigDecimal;
import java.util.List;

public record SearchSuggestionsResponse(
        List<ProductSuggestionDto> products,
        List<CategorySuggestionDto> categories,
        List<String> brands
) {
    public record ProductSuggestionDto(
            Long id,
            String name,
            BigDecimal price,
            String priceCurrency,
            String imageUrl,
            String categoryName
    ) {}

    public record CategorySuggestionDto(
            Long id,
            String name,
            String slug
    ) {}
}
