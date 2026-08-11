package com.shopsphere.cart.mapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.dto.CartItemResponse;
import com.shopsphere.cart.dto.CartResponse;

public final class CartMapper {
    private CartMapper() {}

    public static CartItemResponse toItemResponse(
            CartItem item,
            boolean available,
            String imageUrl,
            String categoryName,
            Integer stock,
            Double averageRating,
            Integer reviewCount,
            BigDecimal originalPrice
    ) {
        return new CartItemResponse(
                item.getId(),
                item.getProductId(),
                item.getSkuSnapshot(),
                item.getProductNameSnapshot(),
                item.getPriceAmountSnapshot(),
                item.getPriceCurrencySnapshot(),
                item.getQuantity(),
                available,
                imageUrl,
                categoryName,
                stock,
                averageRating,
                reviewCount,
                originalPrice
        );
    }

    public static CartResponse toCartResponse(Cart cart, List<CartItemResponse> items, Map<String, BigDecimal> totals) {
        int itemCount = items.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(cart.getId(), items, totals, itemCount, cart.getCreatedAt(), cart.getUpdatedAt());
    }
}
