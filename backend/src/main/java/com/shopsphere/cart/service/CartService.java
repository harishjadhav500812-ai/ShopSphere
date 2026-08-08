package com.shopsphere.cart.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.dto.CartItemResponse;
import com.shopsphere.cart.dto.CartResponse;
import com.shopsphere.cart.dto.CreateCartItemRequest;
import com.shopsphere.cart.dto.UpdateCartItemRequest;
import com.shopsphere.cart.mapper.CartMapper;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;

@Service
public class CartService {

    private static final int MAX_QUANTITY = 10_000;

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId).orElseGet(() -> new Cart(userId));
        if (cart.getId() == null) {
            return CartMapper.toCartResponse(cart, List.of(), Map.of());
        }

        List<CartItemResponse> items = cartItemRepository.findByCartId(cart.getId()).stream()
                .map(item -> {
                    Optional<Product> p = productRepository.findById(item.getProductId());
                    boolean available = p.isPresent() && p.get().isActive();
                    return CartMapper.toItemResponse(item, available);
                })
                .collect(Collectors.toList());

        Map<String, BigDecimal> totals = computeTotals(items);
        return CartMapper.toCartResponse(cart, items, totals);
    }

    @Transactional
    public CartResponse addItem(Long userId, CreateCartItemRequest request) {
        if (request.quantity() < 1 || request.quantity() > MAX_QUANTITY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity");
        }

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not available");
        }

        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId).orElseGet(() -> cartRepository.save(new Cart(userId)));

        Optional<CartItem> existing = cartItemRepository.findByCartIdAndProductId(cart.getId(), request.productId());
        CartItem item;
        if (existing.isPresent()) {
            item = existing.get();
            int newQty = item.getQuantity() + request.quantity();
            if (newQty > MAX_QUANTITY) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity exceeds maximum");
            }
            item.setQuantity(newQty);
            item.setPriceAmountSnapshot(product.getPriceAmount());
            item.setPriceCurrencySnapshot(product.getPriceCurrency());
            item.setProductNameSnapshot(product.getName());
            item.setSkuSnapshot(product.getSku());
            item = cartItemRepository.save(item);
        } else {
            item = new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), product.getPriceCurrency(), request.quantity());
            item = cartItemRepository.save(item);
        }

        return getCart(userId);
    }

    @Transactional
    public CartResponse updateItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        if (request.quantity() < 1 || request.quantity() > MAX_QUANTITY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quantity");
        }

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        Cart cart = item.getCart();
        if (!cart.isActive() || !cart.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }

        Product product = productRepository.findById(item.getProductId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not available");
        }

        item.setQuantity(request.quantity());
        item.setPriceAmountSnapshot(product.getPriceAmount());
        item.setPriceCurrencySnapshot(product.getPriceCurrency());
        item.setProductNameSnapshot(product.getName());
        item.setSkuSnapshot(product.getSku());
        cartItemRepository.save(item);

        return getCart(userId);
    }

    @Transactional
    public void removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart item not found"));
        Cart cart = item.getCart();
        if (!cart.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserIdAndActiveTrue(userId).orElse(null);
        if (cart == null) return;
        if (!cart.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        cartItemRepository.deleteByCartId(cart.getId());
    }

    private Map<String, BigDecimal> computeTotals(List<CartItemResponse> items) {
        Map<String, BigDecimal> totals = new HashMap<>();
        for (CartItemResponse item : items) {
            if (!item.available()) continue;
            String cur = item.priceCurrency();
            BigDecimal line = item.priceAmount().multiply(BigDecimal.valueOf(item.quantity()));
            totals.put(cur, totals.getOrDefault(cur, BigDecimal.ZERO).add(line));
        }
        return totals;
    }
}
