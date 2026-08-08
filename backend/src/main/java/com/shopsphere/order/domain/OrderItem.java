package com.shopsphere.order.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(length = 64)
    private String sku;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "unit_price_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPriceAmount;

    @Column(name = "price_currency", nullable = false, length = 3)
    private String priceCurrency;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 19, scale = 2)
    private BigDecimal lineTotal;

    protected OrderItem() {
        // JPA
    }

    public OrderItem(
            Order order,
            Long productId,
            Long sellerId,
            String sku,
            String productName,
            BigDecimal unitPriceAmount,
            String priceCurrency,
            Integer quantity,
            BigDecimal lineTotal
    ) {
        this.order = order;
        this.productId = productId;
        this.sellerId = sellerId;
        this.sku = sku;
        this.productName = productName;
        this.unitPriceAmount = unitPriceAmount;
        this.priceCurrency = priceCurrency;
        this.quantity = quantity;
        this.lineTotal = lineTotal;
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public Long getOrderId() {
        return order == null ? null : order.getId();
    }

    public Long getProductId() {
        return productId;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public String getSku() {
        return sku;
    }

    public String getProductName() {
        return productName;
    }

    public BigDecimal getUnitPriceAmount() {
        return unitPriceAmount;
    }

    public String getPriceCurrency() {
        return priceCurrency;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }
}
