package com.shopsphere.coupon;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.cart.domain.Cart;
import com.shopsphere.cart.domain.CartItem;
import com.shopsphere.cart.repository.CartItemRepository;
import com.shopsphere.cart.repository.CartRepository;
import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.coupon.domain.Coupon;
import com.shopsphere.coupon.domain.DiscountType;
import com.shopsphere.coupon.repository.CouponRepository;
import com.shopsphere.coupon.service.CouponService;
import com.shopsphere.order.domain.Order;
import com.shopsphere.order.domain.OrderStatus;
import com.shopsphere.order.repository.OrderRepository;
import com.shopsphere.pricing.service.PricingCalculator;
import com.shopsphere.pricing.service.PricingResult;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.security.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CouponTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponService couponService;

    @Autowired
    private PricingCalculator pricingCalculator;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderRepository orderRepository;

    // 1. adminCanCreateCoupon
    @Test
    void adminCanCreateCoupon() throws Exception {
        String code = "WELCOME10_" + uniqueId();
        String body = """
                {
                    "code": "%s",
                    "discountType": "PERCENTAGE",
                    "discountValue": 10.00,
                    "minimumOrderAmount": 100.00,
                    "maximumDiscountAmount": 50.00,
                    "usageLimit": 50
                }
                """.formatted(code);

        mockMvc.perform(post("/api/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(code.toUpperCase()))
                .andExpect(jsonPath("$.discountType").value("PERCENTAGE"))
                .andExpect(jsonPath("$.discountValue").value(10.00));
    }

    // 2. nonAdminCannotCreateCoupon
    @Test
    void nonAdminCannotCreateCoupon() throws Exception {
        String body = """
                {
                    "code": "CUST10",
                    "discountType": "FIXED_AMOUNT",
                    "discountValue": 10.00
                }
                """;

        mockMvc.perform(post("/api/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    // 3. unauthenticatedUserCannotCreateCoupon
    @Test
    void unauthenticatedUserCannotCreateCoupon() throws Exception {
        String body = """
                {
                    "code": "ANON10",
                    "discountType": "FIXED_AMOUNT",
                    "discountValue": 10.00
                }
                """;

        mockMvc.perform(post("/api/admin/coupons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // 4. duplicateCouponCodeIsRejected
    @Test
    void duplicateCouponCodeIsRejected() throws Exception {
        String code = "DUP_" + uniqueId();
        createCoupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("15.00"));

        String body = """
                {
                    "code": "%s",
                    "discountType": "FIXED_AMOUNT",
                    "discountValue": 20.00
                }
                """.formatted(code);

        mockMvc.perform(post("/api/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // 5. invalidDiscountValueIsRejected
    @Test
    void invalidDiscountValueIsRejected() throws Exception {
        String body = """
                {
                    "code": "BAD_DISCOUNT",
                    "discountType": "PERCENTAGE",
                    "discountValue": 0.00
                }
                """;

        mockMvc.perform(post("/api/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(uniqueId(), "ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    // 6. validPercentageCouponWorks
    @Test
    void validPercentageCouponWorks() {
        Coupon coupon = createCoupon("PERC20_" + uniqueId(), DiscountType.PERCENTAGE, new BigDecimal("20.00"));

        PricingResult result = pricingCalculator.calculatePricing(new BigDecimal("200.00"), coupon);
        assertThat(result.discountAmount()).isEqualByComparingTo("40.00");
    }

    // 7. validFixedCouponWorks
    @Test
    void validFixedCouponWorks() {
        Coupon coupon = createCoupon("FLAT50_" + uniqueId(), DiscountType.FIXED_AMOUNT, new BigDecimal("50.00"));

        PricingResult result = pricingCalculator.calculatePricing(new BigDecimal("200.00"), coupon);
        assertThat(result.discountAmount()).isEqualByComparingTo("50.00");
    }

    // 8. expiredCouponRejected
    @Test
    void expiredCouponRejected() {
        String code = "EXPIRED_" + uniqueId();
        Coupon c = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("10.00"), null, null,
                Instant.now().minus(2, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.DAYS), null, true);
        couponRepository.save(c);

        assertThatThrownBy(() -> couponService.validateAndApplyCoupon(code, new BigDecimal("100.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Coupon has expired");
    }

    // 9. inactiveCouponRejected
    @Test
    void inactiveCouponRejected() {
        String code = "INACTIVE_" + uniqueId();
        Coupon c = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("10.00"), null, null, null, null, null, false);
        couponRepository.save(c);

        assertThatThrownBy(() -> couponService.validateAndApplyCoupon(code, new BigDecimal("100.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Coupon is inactive");
    }

    // 10. futureCouponRejected
    @Test
    void futureCouponRejected() {
        String code = "FUTURE_" + uniqueId();
        Coupon c = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("10.00"), null, null,
                Instant.now().plus(1, ChronoUnit.DAYS), Instant.now().plus(2, ChronoUnit.DAYS), null, true);
        couponRepository.save(c);

        assertThatThrownBy(() -> couponService.validateAndApplyCoupon(code, new BigDecimal("100.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Coupon is not active yet");
    }

    // 11. minimumOrderAmountEnforced
    @Test
    void minimumOrderAmountEnforced() {
        String code = "MIN500_" + uniqueId();
        Coupon c = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("50.00"), new BigDecimal("500.00"), null, null, null, null, true);
        couponRepository.save(c);

        assertThatThrownBy(() -> couponService.validateAndApplyCoupon(code, new BigDecimal("300.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Subtotal does not meet minimum order amount");
    }

    // 12. maximumDiscountEnforced
    @Test
    void maximumDiscountEnforced() {
        Coupon c = new Coupon("MAXDISC_" + uniqueId(), DiscountType.PERCENTAGE, new BigDecimal("50.00"), null, new BigDecimal("100.00"), null, null, null, true);

        PricingResult result = pricingCalculator.calculatePricing(new BigDecimal("1000.00"), c);
        assertThat(result.discountAmount()).isEqualByComparingTo("100.00");
    }

    // 13. usageLimitEnforced
    @Test
    void usageLimitEnforced() {
        String code = "LIMIT1_" + uniqueId();
        Coupon c = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("10.00"), null, null, null, null, 1, true);
        c.setUsedCount(1);
        couponRepository.save(c);

        assertThatThrownBy(() -> couponService.validateAndApplyCoupon(code, new BigDecimal("100.00")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Coupon usage limit reached");
    }

    // 14. caseInsensitiveCouponCodeWorks
    @Test
    void caseInsensitiveCouponCodeWorks() {
        String code = "case_test_" + uniqueId();
        createCoupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("20.00"));

        Coupon applied = couponService.validateAndApplyCoupon(code.toLowerCase(), new BigDecimal("100.00"));
        assertThat(applied).isNotNull();
        assertThat(applied.getCode()).isEqualTo(code.toUpperCase());
    }

    // 15. subtotalCalculatedFromServerSidePrices & tax & total
    @Test
    void subtotalCalculatedFromServerSidePrices() {
        Coupon c = createCoupon("TAX18_" + uniqueId(), DiscountType.PERCENTAGE, new BigDecimal("10.00"));
        PricingCalculator customCalculator = new PricingCalculator(new BigDecimal("0.18"));

        // Subtotal = 100.00, Discount = 10.00, Taxable = 90.00, Tax(18%) = 16.20, Total = 106.20
        PricingResult result = customCalculator.calculatePricing(new BigDecimal("100.00"), c);
        assertThat(result.subtotal()).isEqualByComparingTo("100.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("10.00");
        assertThat(result.taxAmount()).isEqualByComparingTo("16.20");
        assertThat(result.totalAmount()).isEqualByComparingTo("106.20");
    }

    // 16. discountNeverExceedsSubtotal
    @Test
    void discountNeverExceedsSubtotal() {
        Coupon c = createCoupon("BIGDISC_" + uniqueId(), DiscountType.FIXED_AMOUNT, new BigDecimal("500.00"));

        PricingResult result = pricingCalculator.calculatePricing(new BigDecimal("100.00"), c);
        assertThat(result.discountAmount()).isEqualByComparingTo("100.00");
        assertThat(result.totalAmount()).isEqualByComparingTo("0.00");
    }

    // 17. bigDecimalRoundingBehaviorIsCorrect
    @Test
    void bigDecimalRoundingBehaviorIsCorrect() {
        // Subtotal = 33.33, 15% discount = 4.9995 -> rounded to 5.00 HALF_UP
        Coupon c = createCoupon("ROUND_" + uniqueId(), DiscountType.PERCENTAGE, new BigDecimal("15.00"));

        PricingResult result = pricingCalculator.calculatePricing(new BigDecimal("33.33"), c);
        assertThat(result.discountAmount()).isEqualTo(new BigDecimal("5.00"));
    }

    // 18. customerCannotCreateOrUpdateOrDeleteCoupons
    @Test
    void customerCannotCreateOrUpdateOrDeleteCoupons() throws Exception {
        Long couponId = createCoupon("CUST_NO_" + uniqueId(), DiscountType.FIXED_AMOUNT, new BigDecimal("10.00")).getId();
        String token = token(uniqueId(), "CUSTOMER");

        mockMvc.perform(get("/api/admin/coupons/" + couponId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/admin/coupons/" + couponId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/admin/coupons/" + couponId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // 19. sellerCannotManipulateCoupons
    @Test
    void sellerCannotManipulateCoupons() throws Exception {
        String token = token(uniqueId(), "SELLER");

        mockMvc.perform(get("/api/admin/coupons")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // 20. customerCanApplyCouponToOwnOrder
    @Test
    void customerCanApplyCouponToOwnOrder() throws Exception {
        Long userId = uniqueId();
        Product p = createProduct("Coupon Test Product", "100.00", "USD", 10);
        setupCartWithProduct(userId, p, 2); // Subtotal = 200.00

        Coupon coupon = createCoupon("SAVE10_" + uniqueId(), DiscountType.PERCENTAGE, new BigDecimal("10.00"));
        // Subtotal = 200.00, Discount = 20.00, Taxable = 180.00, Tax (0%) = 0.00, Total = 180.00

        mockMvc.perform(post("/api/orders")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"couponCode\": \"" + coupon.getCode() + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal").value(200.00))
                .andExpect(jsonPath("$.discountAmount").value(20.00))
                .andExpect(jsonPath("$.taxAmount").value(0.00))
                .andExpect(jsonPath("$.totalAmount").value(180.00))
                .andExpect(jsonPath("$.couponCode").value(coupon.getCode()));

        Coupon updatedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertThat(updatedCoupon.getUsedCount()).isEqualTo(1);
    }

    // 21. clientCannotOverrideSubtotalOrDiscountOrTaxOrTotal
    @Test
    void clientCannotOverrideSubtotalOrDiscountOrTaxOrTotal() throws Exception {
        Long userId = uniqueId();
        Product p = createProduct("Spoof Test Product", "100.00", "USD", 10);
        setupCartWithProduct(userId, p, 1); // Subtotal = 100.00

        // Client attempts to pass fake totalAmount, taxAmount, subtotal in body
        String body = """
                {
                    "subtotal": 1.00,
                    "discountAmount": 99.00,
                    "taxAmount": 0.00,
                    "totalAmount": 1.00
                }
                """;

        mockMvc.perform(post("/api/orders")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(userId, "CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subtotal").value(100.00))
                .andExpect(jsonPath("$.taxAmount").value(0.00))
                .andExpect(jsonPath("$.totalAmount").value(100.00));
    }

    // 22. couponPersistsAndUniqueConstraintWorks
    @Test
    void couponPersistsAndUniqueConstraintWorks() {
        String code = "UNIQUE_" + uniqueId();
        Coupon c1 = createCoupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("10.00"));
        assertThat(c1.getId()).isNotNull();

        Coupon c2 = new Coupon(code, DiscountType.FIXED_AMOUNT, new BigDecimal("20.00"), null, null, null, null, null, true);
        assertThatThrownBy(() -> couponRepository.saveAndFlush(c2))
                .isNotNull();
    }

    private Coupon createCoupon(String code, DiscountType type, BigDecimal value) {
        Coupon c = new Coupon(code, type, value, null, null, null, null, null, true);
        return couponRepository.save(c);
    }

    private Product createProduct(String name, String price, String currency, int stock) {
        Category category = categoryRepository.save(new Category("Cat " + uniqueId(), "cat-" + uniqueId(), "desc", null));
        Product product = new Product(name, "slug-" + uniqueId(), "desc", new BigDecimal(price), currency, "SKU-" + uniqueId(), stock, uniqueId(), category);
        return productRepository.save(product);
    }

    private void setupCartWithProduct(Long userId, Product product, int quantity) {
        Cart cart = cartRepository.save(new Cart(userId));
        cartItemRepository.save(new CartItem(cart, product.getId(), product.getSku(), product.getName(), product.getPriceAmount(), product.getPriceCurrency(), quantity));
    }

    private String token(Long userId, String role) {
        return jwtService.createAccessToken(role.toLowerCase() + "." + userId + "@shopsphere.test", userId, role, 60);
    }

    private Long uniqueId() {
        return Math.abs(UUID.randomUUID().getMostSignificantBits());
    }
}
