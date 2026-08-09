package com.shopsphere.wishlist.service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.wishlist.domain.Wishlist;
import com.shopsphere.wishlist.domain.WishlistItem;
import com.shopsphere.wishlist.dto.WishlistItemResponse;
import com.shopsphere.wishlist.dto.WishlistResponse;
import com.shopsphere.wishlist.repository.WishlistItemRepository;
import com.shopsphere.wishlist.repository.WishlistRepository;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;

    public WishlistService(
            WishlistRepository wishlistRepository,
            WishlistItemRepository wishlistItemRepository,
            ProductRepository productRepository
    ) {
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public WishlistResponse getWishlist(Long userId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId).orElse(null);
        if (wishlist == null) {
            return new WishlistResponse(null, 0, List.of());
        }
        return toResponse(wishlist);
    }

    @Transactional
    public WishlistResponse addItem(Long userId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!product.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is not available");
        }

        Wishlist wishlist = wishlistRepository.findByUserId(userId)
                .orElseGet(() -> wishlistRepository.save(new Wishlist(userId)));

        if (wishlistItemRepository.findByWishlistIdAndProductId(wishlist.getId(), productId).isPresent()) {
            return toResponse(wishlist);
        }

        wishlistItemRepository.save(new WishlistItem(
                wishlist,
                product.getId(),
                product.getName(),
                product.getPriceAmount(),
                product.getPriceCurrency()
        ));
        return toResponse(wishlist);
    }

    @Transactional
    public WishlistResponse removeItem(Long userId, Long itemId) {
        WishlistItem item = wishlistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found"));
        Wishlist wishlist = item.getWishlist();
        if (!wishlist.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        wishlistItemRepository.delete(item);
        return toResponse(wishlist);
    }

    private WishlistResponse toResponse(Wishlist wishlist) {
        List<WishlistItem> items = wishlistItemRepository.findByWishlistIdOrderByAddedAtDesc(wishlist.getId());
        List<Long> productIds = items.stream().map(WishlistItem::getProductId).distinct().toList();
        Map<Long, Product> products = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<WishlistItemResponse> mapped = items.stream()
                .map(item -> {
                    Product product = products.get(item.getProductId());
                    return new WishlistItemResponse(
                            item.getId(),
                            item.getProductId(),
                            product != null ? product.getName() : item.getProductNameSnapshot(),
                            product != null ? product.getPriceAmount() : item.getPriceAmountSnapshot(),
                            product != null ? product.getPriceCurrency() : item.getPriceCurrencySnapshot(),
                            product != null && product.isActive(),
                            item.getAddedAt()
                    );
                })
                .toList();

        return new WishlistResponse(wishlist.getId(), mapped.size(), mapped);
    }
}
