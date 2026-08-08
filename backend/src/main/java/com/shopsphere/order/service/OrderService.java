package com.shopsphere.order.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.dto.OrderListItem;
import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.mapper.OrderMapper;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public OrderResponse createOrderFromCart(Long userId) {
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active cart not found"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        List<Long> productIds = cartItems.stream().map(CartItem::getProductId).distinct().toList();
        Map<Long, Product> products = productRepository.findAllById(productIds)
                .stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        String currency = null;
        BigDecimal total = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            Product product = products.get(item.getProductId());
            if (product == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
            }
            if (!product.isActive()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is not available");
            }
            if (item.getQuantity() == null || item.getQuantity() < 1) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity");
            }
            if (item.getQuantity() > product.getStock()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock");
            }
            if (currency == null) {
                currency = product.getPriceCurrency();
            } else if (!currency.equals(product.getPriceCurrency())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart contains multiple currencies");
            }
            total = total.add(product.getPriceAmount().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        Order order = orderRepository.save(new Order(userId, OrderStatus.PENDING, total, currency));
        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> toOrderItem(order, item, products.get(item.getProductId())))
                .toList();
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);

        cartItemRepository.deleteByCartId(cart.getId());

        return OrderMapper.toResponse(order, savedItems);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id, Long userId) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return OrderMapper.toResponse(order, orderItemRepository.findByOrderId(order.getId()));
    }

    @Transactional(readOnly = true)
    public List<OrderListItem> getCustomerOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(OrderMapper::toListItem)
                .toList();
    }

    private OrderItem toOrderItem(Order order, CartItem cartItem, Product product) {
        BigDecimal lineTotal = product.getPriceAmount().multiply(BigDecimal.valueOf(cartItem.getQuantity()));
        return new OrderItem(
                order,
                product.getId(),
                product.getSellerId(),
                product.getSku(),
                product.getName(),
                product.getPriceAmount(),
                product.getPriceCurrency(),
                cartItem.getQuantity(),
                lineTotal
        );
    }
}
