package com.shopsphere.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long itemId,
        Long productId,
        String sku,
        String productName,
        BigDecimal priceAmount,
        String priceCurrency,
        Integer quantity,
        boolean available,
        String imageUrl,
        String categoryName,
        Integer stock,
        Double averageRating,
        Integer reviewCount,
        BigDecimal originalPrice
) {}
