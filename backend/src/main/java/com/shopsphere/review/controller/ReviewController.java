package com.shopsphere.review.controller;

import java.util.List;

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

import com.shopsphere.review.dto.CreateReviewRequest;
import com.shopsphere.review.dto.ReviewResponse;
import com.shopsphere.review.service.ReviewService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "/api/products/{productId}/reviews", produces = MediaType.APPLICATION_JSON_VALUE)
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    private Long currentUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    @GetMapping
    public List<ReviewResponse> list(@PathVariable Long productId) {
        return reviewService.listForProduct(productId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(
            @PathVariable Long productId,
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication
    ) {
        return reviewService.upsert(productId, currentUserId(authentication), request);
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOwn(@PathVariable Long productId, Authentication authentication) {
        reviewService.deleteOwn(productId, currentUserId(authentication));
    }
}
