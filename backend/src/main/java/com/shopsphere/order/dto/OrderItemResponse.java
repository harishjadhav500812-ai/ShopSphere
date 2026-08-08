package com.shopsphere.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        Long sellerId,
        String sku,
        String productName,
        BigDecimal unitPriceAmount,
        String priceCurrency,
        Integer quantity,
        BigDecimal lineTotal
) {
}
