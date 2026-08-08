package com.shopsphere.order.mapper;

import java.util.List;

import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.dto.OrderItemResponse;
import com.shopsphere.order.dto.OrderListItem;
import com.shopsphere.order.dto.OrderResponse;

public final class OrderMapper {

    private OrderMapper() {
    }

    public static OrderResponse toResponse(Order order, List<OrderItem> items) {
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                items.stream().map(OrderMapper::toItemResponse).toList(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    public static OrderListItem toListItem(Order order) {
        return new OrderListItem(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }

    private static OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProductId(),
                item.getSellerId(),
                item.getSku(),
                item.getProductName(),
                item.getUnitPriceAmount(),
                item.getPriceCurrency(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }
}
