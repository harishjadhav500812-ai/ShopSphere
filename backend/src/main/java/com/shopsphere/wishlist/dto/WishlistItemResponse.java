package com.shopsphere.wishlist.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record WishlistItemResponse(
        Long itemId,
        Long productId,
        String productName,
        BigDecimal priceAmount,
        String priceCurrency,
        boolean available,
        Instant addedAt
) {
}
