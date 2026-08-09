package com.shopsphere.wishlist.domain;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "wishlist_items", uniqueConstraints = @UniqueConstraint(name = "uk_wishlist_items_wishlist_product", columnNames = { "wishlist_id", "product_id" }))
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wishlist_id", nullable = false)
    private Wishlist wishlist;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name_snapshot", nullable = false, length = 200)
    private String productNameSnapshot;

    @Column(name = "price_amount_snapshot", precision = 19, scale = 2)
    private BigDecimal priceAmountSnapshot;

    @Column(name = "price_currency_snapshot", length = 3)
    private String priceCurrencySnapshot;

    @Column(name = "added_at", nullable = false, updatable = false)
    private Instant addedAt;

    protected WishlistItem() {
        // JPA
    }

    public WishlistItem(Wishlist wishlist, Long productId, String productNameSnapshot, BigDecimal priceAmountSnapshot, String priceCurrencySnapshot) {
        this.wishlist = wishlist;
        this.productId = productId;
        this.productNameSnapshot = productNameSnapshot;
        this.priceAmountSnapshot = priceAmountSnapshot;
        this.priceCurrencySnapshot = priceCurrencySnapshot;
    }

    @PrePersist
    void onCreate() {
        this.addedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Wishlist getWishlist() {
        return wishlist;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductNameSnapshot() {
        return productNameSnapshot;
    }

    public void setProductNameSnapshot(String productNameSnapshot) {
        this.productNameSnapshot = productNameSnapshot;
    }

    public BigDecimal getPriceAmountSnapshot() {
        return priceAmountSnapshot;
    }

    public void setPriceAmountSnapshot(BigDecimal priceAmountSnapshot) {
        this.priceAmountSnapshot = priceAmountSnapshot;
    }

    public String getPriceCurrencySnapshot() {
        return priceCurrencySnapshot;
    }

    public void setPriceCurrencySnapshot(String priceCurrencySnapshot) {
        this.priceCurrencySnapshot = priceCurrencySnapshot;
    }

    public Instant getAddedAt() {
        return addedAt;
    }
}
