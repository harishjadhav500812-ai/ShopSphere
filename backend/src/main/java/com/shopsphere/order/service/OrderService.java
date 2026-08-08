package com.shopsphere.order.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
import com.shopsphere.coupon.domain.Coupon;
import com.shopsphere.coupon.service.CouponService;
import com.shopsphere.order.dto.CreateOrderRequest;
import com.shopsphere.payment.dto.PaymentRequest;
import com.shopsphere.payment.dto.PaymentResult;
import com.shopsphere.payment.service.PaymentGateway;
import com.shopsphere.payment.service.PaymentService;
import com.shopsphere.pricing.service.PricingCalculator;
import com.shopsphere.pricing.service.PricingResult;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import org.springframework.context.annotation.Lazy;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final PaymentGateway paymentGateway;
    private final PaymentService paymentService;
    private final CouponService couponService;
    private final PricingCalculator pricingCalculator;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            PaymentGateway paymentGateway,
            @Lazy PaymentService paymentService,
            CouponService couponService,
            PricingCalculator pricingCalculator
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.paymentGateway = paymentGateway;
        this.paymentService = paymentService;
        this.couponService = couponService;
        this.pricingCalculator = pricingCalculator;
    }

    @Transactional
    public OrderResponse createOrderFromCart(Long userId) {
        return createOrderFromCart(userId, null);
    }

    @Transactional
    public OrderResponse createOrderFromCart(Long userId, CreateOrderRequest request) {
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
        BigDecimal subtotal = BigDecimal.ZERO;
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
            subtotal = subtotal.add(product.getPriceAmount().multiply(BigDecimal.valueOf(item.getQuantity())));
        }

        Coupon coupon = null;
        if (request != null && request.couponCode() != null && !request.couponCode().trim().isEmpty()) {
            coupon = couponService.validateAndApplyCoupon(request.couponCode(), subtotal);
        }

        PricingResult pricing = pricingCalculator.calculatePricing(subtotal, coupon);

        Order order = orderRepository.save(new Order(
                userId,
                OrderStatus.PENDING,
                pricing.subtotal(),
                pricing.discountAmount(),
                pricing.taxAmount(),
                pricing.totalAmount(),
                currency,
                pricing.couponCode()
        ));
        List<OrderItem> orderItems = cartItems.stream()
                .map(item -> toOrderItem(order, item, products.get(item.getProductId())))
                .toList();
        List<OrderItem> savedItems = orderItemRepository.saveAll(orderItems);

        cartItemRepository.deleteByCartId(cart.getId());

        return OrderMapper.toResponse(order, savedItems);
    }

    @Transactional
    public OrderResponse payOrder(Long id, Long userId) {
        paymentService.createAndProcessPayment(id, userId);
        Order savedOrder = orderRepository.findById(id).orElseThrow();
        List<OrderItem> items = orderItemRepository.findByOrderId(id);
        return OrderMapper.toResponse(savedOrder, items);
    }

    @Transactional
    public void deductStockForOrder(Long orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        lockAndDeductStock(items);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, Long userId) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        if (!order.getStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel order in status " + order.getStatus());
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        if (order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PROCESSING) {
            lockAndRestoreStock(items);
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);
        return OrderMapper.toResponse(savedOrder, items);
    }

    @Transactional
    public OrderResponse updateOrderStatusByAdmin(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status transition from " + order.getStatus() + " to " + newStatus);
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        if (order.getStatus() == OrderStatus.PENDING && newStatus == OrderStatus.CONFIRMED) {
            lockAndDeductStock(items);
        }
        if (newStatus == OrderStatus.CANCELLED && (order.getStatus() == OrderStatus.CONFIRMED || order.getStatus() == OrderStatus.PROCESSING)) {
            lockAndRestoreStock(items);
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);
        return OrderMapper.toResponse(savedOrder, items);
    }

    private void lockAndDeductStock(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        List<Long> productIds = items.stream().map(OrderItem::getProductId).sorted().distinct().toList();
        List<Product> lockedProducts = productRepository.findAllByIdForUpdate(productIds);
        Map<Long, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        for (OrderItem item : items) {
            Product product = productMap.get(item.getProductId());
            if (product == null || !product.isActive()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Product is not available");
            }
            if (product.getStock() < item.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient stock for product: " + product.getName());
            }
        }

        for (OrderItem item : items) {
            Product product = productMap.get(item.getProductId());
            product.setStock(product.getStock() - item.getQuantity());
        }
        productRepository.saveAll(lockedProducts);
    }

    private void lockAndRestoreStock(List<OrderItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        List<Long> productIds = items.stream().map(OrderItem::getProductId).sorted().distinct().toList();
        List<Product> lockedProducts = productRepository.findAllByIdForUpdate(productIds);
        Map<Long, Product> productMap = lockedProducts.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        for (OrderItem item : items) {
            Product product = productMap.get(item.getProductId());
            if (product != null) {
                product.setStock(product.getStock() + item.getQuantity());
            }
        }
        productRepository.saveAll(lockedProducts);
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

    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(Long userId, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        return mapOrderPage(orderPage, pageable, null);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrdersForAdmin(Pageable pageable) {
        Page<Order> orderPage = orderRepository.findAll(pageable);
        return mapOrderPage(orderPage, pageable, null);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getSellerOrders(Long sellerId, Pageable pageable) {
        Page<Order> orderPage = orderRepository.findBySellerId(sellerId, pageable);
        return mapOrderPage(orderPage, pageable, sellerId);
    }

    private Page<OrderResponse> mapOrderPage(Page<Order> orderPage, Pageable pageable, Long sellerIdFilter) {
        List<Order> orders = orderPage.getContent();
        if (orders.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, orderPage.getTotalElements());
        }

        List<Long> orderIds = orders.stream().map(Order::getId).toList();
        List<OrderItem> items = sellerIdFilter == null
                ? orderItemRepository.findByOrderIdIn(orderIds)
                : orderItemRepository.findByOrderIdInAndSellerId(orderIds, sellerIdFilter);

        Map<Long, List<OrderItem>> itemsByOrderId = items.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        List<OrderResponse> responses = orders.stream()
                .map(order -> OrderMapper.toResponse(order, itemsByOrderId.getOrDefault(order.getId(), List.of())))
                .toList();

        return new PageImpl<>(responses, pageable, orderPage.getTotalElements());
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
