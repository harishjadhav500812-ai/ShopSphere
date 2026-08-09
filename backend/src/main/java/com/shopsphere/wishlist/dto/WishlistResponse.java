package com.shopsphere.wishlist.dto;

import java.util.List;

public record WishlistResponse(
        Long wishlistId,
        Integer itemCount,
        List<WishlistItemResponse> items
) {
}
