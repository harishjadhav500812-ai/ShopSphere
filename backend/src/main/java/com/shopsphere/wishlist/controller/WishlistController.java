package com.shopsphere.wishlist.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.wishlist.dto.AddWishlistItemRequest;
import com.shopsphere.wishlist.dto.WishlistResponse;
import com.shopsphere.wishlist.service.WishlistService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api/wishlist", produces = MediaType.APPLICATION_JSON_VALUE)
@PreAuthorize("hasRole('CUSTOMER')")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    private Long currentUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    @GetMapping
    public WishlistResponse getWishlist(Authentication authentication) {
        return wishlistService.getWishlist(currentUserId(authentication));
    }

    @PostMapping(path = "/items", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistResponse addItem(@Valid @RequestBody AddWishlistItemRequest request, Authentication authentication) {
        return wishlistService.addItem(currentUserId(authentication), request.productId());
    }

    @DeleteMapping(path = "/items/{itemId}")
    public WishlistResponse removeItem(@PathVariable Long itemId, Authentication authentication) {
        return wishlistService.removeItem(currentUserId(authentication), itemId);
    }
}
