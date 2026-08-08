package com.shopsphere.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.order.domain.OrderItem;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.dto.OrderResponse;
import com.shopsphere.order.repository.OrderItemRepository;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.order.service.OrderService;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;

@SpringBootTest
@ActiveProfiles("test")
class OrderServiceTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void createsOrderFromCartWithSnapshotsAndClearsCart() {
        Long userId = uniqueId();
        Product first = product("Order Product A", "15.50", "USD", 8, 7001L);
        Product second = product("Order Product B", "7.25", "USD", 5, 7002L);
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, first.getId(), "OLD-SKU-A", "Old A", new BigDecimal("1.00"), "USD", 2));
        cartItemRepository.save(new CartItem(cart, second.getId(), "OLD-SKU-B", "Old B", new BigDecimal("1.00"), "USD", 3));

        OrderResponse response = orderService.createOrderFromCart(userId);

        assertThat(response.status()).isEqualTo(OrderStatus.PENDING);
        assertThat(response.currency()).isEqualTo("USD");
        assertThat(response.totalAmount()).isEqualByComparingTo("52.75");
        assertThat(response.items()).hasSize(2);
        assertThat(response.items()).extracting("quantity").containsExactlyInAnyOrder(2, 3);
        assertThat(response.items()).extracting("productName").containsExactlyInAnyOrder(first.getName(), second.getName());
        assertThat(response.items()).extracting("sellerId").containsExactlyInAnyOrder(7001L, 7002L);
        assertThat(response.items()).extracting("sku").containsExactlyInAnyOrder(first.getSku(), second.getSku());
        assertThat(response.items()).extracting("unitPriceAmount").containsExactlyInAnyOrder(first.getPriceAmount(), second.getPriceAmount());
        assertThat(response.items()).extracting("lineTotal").containsExactlyInAnyOrder(new BigDecimal("31.00"), new BigDecimal("21.75"));
        assertThat(cartItemRepository.findByCartId(cart.getId())).isEmpty();
        assertThat(productRepository.findById(first.getId()).orElseThrow().getStock()).isEqualTo(8);

        List<OrderItem> persistedItems = orderItemRepository.findByOrderId(response.id());
        assertThat(orderRepository.findById(response.id())).isPresent();
        assertThat(persistedItems).hasSize(2);
    }

    @Test
    void emptyCartRejected() {
        Long userId = uniqueId();
        cartRepository.save(new Cart(userId));

        assertStatus(
                () -> orderService.createOrderFromCart(userId),
                HttpStatus.BAD_REQUEST,
                "Cart is empty"
        );
    }

    @Test
    void missingProductRejectedAndCartUnchanged() {
        Long userId = uniqueId();
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, 99999999L, "SKU-MISSING", "Missing", new BigDecimal("3.00"), "USD", 1));

        assertStatus(
                () -> orderService.createOrderFromCart(userId),
                HttpStatus.NOT_FOUND,
                "Product not found"
        );
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);
    }

    @Test
    void inactiveProductRejectedAndCartUnchanged() {
        Long userId = uniqueId();
        Product product = product("Inactive Product", "10.00", "USD", 3, 7003L);
        product.setActive(false);
        productRepository.save(product);
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), "USD", 1));

        assertStatus(
                () -> orderService.createOrderFromCart(userId),
                HttpStatus.CONFLICT,
                "Product is not available"
        );
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);
    }

    @Test
    void insufficientStockRejectedAndCartUnchanged() {
        Long userId = uniqueId();
        Product product = product("Low Stock Product", "10.00", "USD", 1, 7004L);
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), "USD", 2));

        assertStatus(
                () -> orderService.createOrderFromCart(userId),
                HttpStatus.CONFLICT,
                "Insufficient stock"
        );
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);
    }

    @Test
    void invalidQuantityRejectedAndCartUnchanged() {
        Long userId = uniqueId();
        Product product = product("Invalid Quantity Product", "10.00", "USD", 3, 7005L);
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), "USD", 0));

        assertStatus(
                () -> orderService.createOrderFromCart(userId),
                HttpStatus.BAD_REQUEST,
                "Invalid quantity"
        );
        assertThat(cartItemRepository.findByCartId(cart.getId())).hasSize(1);
    }

    @Test
    void customerCannotCreateOrderForAnotherUsersCart() {
        Long ownerId = uniqueId();
        Long otherUserId = uniqueId();
        Product product = product("Other Cart Product", "10.00", "USD", 3, 7006L);
        Cart otherCart = cartRepository.save(new Cart(otherUserId));
        cartItemRepository.save(new CartItem(otherCart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), "USD", 1));

        assertStatus(
                () -> orderService.createOrderFromCart(ownerId),
                HttpStatus.NOT_FOUND,
                "Active cart not found"
        );
        assertThat(cartItemRepository.findByCartId(otherCart.getId())).hasSize(1);
    }

    private Product product(String namePrefix, String price, String currency, int stock, Long sellerId) {
        String suffix = UUID.randomUUID().toString();
        Category category = categoryRepository.save(new Category("Order Category " + suffix, "order-category-" + suffix, null, null));
        Product product = new Product(
                namePrefix + " " + suffix,
                "order-product-" + suffix,
                "Description",
                new BigDecimal(price),
                currency,
                "ORDER-SKU-" + suffix,
                stock,
                sellerId,
                category
        );
        return productRepository.save(product);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }

    private void assertStatus(Runnable action, HttpStatus status, String message) {
        assertThatThrownBy(action::run)
                .isInstanceOfSatisfying(ResponseStatusException.class, ex -> {
                    assertThat(ex.getStatusCode()).isEqualTo(status);
                    assertThat(ex.getReason()).isEqualTo(message);
                });
    }
}
