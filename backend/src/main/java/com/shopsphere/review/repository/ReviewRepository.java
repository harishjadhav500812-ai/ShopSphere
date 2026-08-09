package com.shopsphere.review.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.shopsphere.review.domain.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    long countByProductId(Long productId);

    @Query("SELECT r.productId AS productId, AVG(r.rating) AS averageRating, COUNT(r.id) AS reviewCount " +
            "FROM Review r WHERE r.productId IN :productIds GROUP BY r.productId")
    List<ReviewSummaryProjection> summarizeByProductIds(@Param("productIds") Collection<Long> productIds);

    @Modifying
    long deleteByProductIdAndUserId(Long productId, Long userId);

    interface ReviewSummaryProjection {
        Long getProductId();

        Double getAverageRating();

        Long getReviewCount();
    }
}
