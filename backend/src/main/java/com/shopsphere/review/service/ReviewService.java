package com.shopsphere.review.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.review.domain.Review;
import com.shopsphere.review.dto.CreateReviewRequest;
import com.shopsphere.review.dto.ReviewResponse;
import com.shopsphere.review.repository.ReviewRepository;
import com.shopsphere.user.domain.User;
import com.shopsphere.user.repository.UserRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public record ReviewSummary(Double averageRating, Integer reviewCount) {
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listForProduct(Long productId) {
        requireProduct(productId);
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        Map<Long, User> users = loadUsers(reviews.stream().map(Review::getUserId).collect(Collectors.toSet()));
        return reviews.stream().map(r -> toResponse(r, users.get(r.getUserId()))).toList();
    }

    @Transactional
    public ReviewResponse upsert(Long productId, Long userId, CreateReviewRequest request) {
        requireProduct(productId);

        Review review = reviewRepository.findByProductIdAndUserId(productId, userId)
                .orElse(new Review(productId, userId, request.rating(), normalize(request.comment())));
        review.setRating(request.rating());
        review.setComment(normalize(request.comment()));
        Review saved = reviewRepository.save(review);

        User user = userRepository.findById(userId).orElse(null);
        return toResponse(saved, user);
    }

    @Transactional
    public void deleteOwn(Long productId, Long userId) {
        requireProduct(productId);
        long deleted = reviewRepository.deleteByProductIdAndUserId(productId, userId);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found");
        }
    }

    @Transactional(readOnly = true)
    public Map<Long, ReviewSummary> summariesForProducts(Collection<Long> productIds) {
        Map<Long, ReviewSummary> summaries = new HashMap<>();
        if (productIds == null || productIds.isEmpty()) {
            return summaries;
        }
        for (ReviewRepository.ReviewSummaryProjection row : reviewRepository.summarizeByProductIds(productIds)) {
            double average = row.getAverageRating() == null ? 0d : Math.round(row.getAverageRating() * 10d) / 10d;
            int count = row.getReviewCount() == null ? 0 : row.getReviewCount().intValue();
            summaries.put(row.getProductId(), new ReviewSummary(average, count));
        }
        return summaries;
    }

    private Product requireProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Map<Long, User> loadUsers(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String normalize(String comment) {
        if (comment == null || comment.isBlank()) {
            return null;
        }
        return comment.trim();
    }

    private ReviewResponse toResponse(Review review, User user) {
        return new ReviewResponse(
                review.getId(),
                review.getProductId(),
                review.getUserId(),
                user != null ? user.getFullName() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
