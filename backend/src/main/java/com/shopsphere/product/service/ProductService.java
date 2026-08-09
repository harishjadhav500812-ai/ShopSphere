package com.shopsphere.product.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.repository.CategoryRepository;
import com.shopsphere.product.domain.Product;
import com.shopsphere.product.dto.CreateProductRequest;
import com.shopsphere.product.dto.ProductResponse;
import com.shopsphere.product.dto.UpdateProductRequest;
import com.shopsphere.product.mapper.ProductMapper;
import com.shopsphere.product.repository.ProductRepository;
import com.shopsphere.review.service.ReviewService;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewService reviewService;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\-]");

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository, ReviewService reviewService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.reviewService = reviewService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        List<Product> products = productRepository.findAll();
        List<Long> productIds = products.stream().map(Product::getId).toList();
        Map<Long, ReviewService.ReviewSummary> summaries = reviewService.summariesForProducts(productIds);
        return products.stream()
                .map(p -> toResponseWithSummary(p, summaries.get(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return toResponseWithSummary(p, reviewService.summariesForProducts(List.of(id)).get(id));
    }

    @Transactional
    public ProductResponse create(CreateProductRequest request, Long sellerId) {
        String name = normalize(request.name());
        String slug = slugify(name);
        if (productRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product slug already exists");
        }

        String sku = normalizeOptional(request.sku());
        if (sku != null && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product SKU already exists");
        }

        Category category = findCategory(request.categoryId());
        Product product = new Product(
                name,
                slug,
                request.description(),
                request.price(),
                normalizeCurrency(request.priceCurrency()),
                sku,
                request.stock(),
                sellerId,
                category
        );
        product.setImageUrl(normalizeOptional(request.imageUrl()));
        Product saved = productRepository.save(product);
        return toResponseWithSummary(saved, null);
    }

    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest request, Long actorUserId, boolean admin) {
        Product product = findProductForWrite(id, actorUserId, admin);

        String name = normalize(request.name());
        String slug = slugify(name);
        if (productRepository.existsBySlugAndIdNot(slug, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product slug already exists");
        }

        String sku = normalizeOptional(request.sku());
        if (sku != null && productRepository.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Product SKU already exists");
        }

        product.setName(name);
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setPriceCurrency(normalizeCurrency(request.priceCurrency()));
        product.setSku(sku);
        product.setStock(request.stock());
        product.setImageUrl(normalizeOptional(request.imageUrl()));
        product.setCategory(findCategory(request.categoryId()));

        return toResponseWithSummary(productRepository.save(product), null);
    }

    @Transactional
    public ProductResponse updateStatus(Long id, boolean active, Long actorUserId, boolean admin) {
        Product product = findProductForWrite(id, actorUserId, admin);
        product.setActive(active);
        return toResponseWithSummary(productRepository.save(product), null);
    }

    @Transactional
    public void softDelete(Long id, Long actorUserId, boolean admin) {
        Product product = findProductForWrite(id, actorUserId, admin);
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public ProductResponse updateStock(Long id, Integer quantity, Long actorUserId, boolean admin) {
        Product product = findProductForWrite(id, actorUserId, admin);
        product.setStock(quantity);
        return toResponseWithSummary(productRepository.save(product), null);
    }

    private ProductResponse toResponseWithSummary(Product product, ReviewService.ReviewSummary summary) {
        ReviewService.ReviewSummary resolved = summary;
        if (resolved == null && product.getId() != null) {
            resolved = reviewService.summariesForProducts(List.of(product.getId())).get(product.getId());
        }
        Double averageRating = resolved != null ? resolved.averageRating() : null;
        Integer reviewCount = resolved != null ? resolved.reviewCount() : 0;
        return ProductMapper.toResponse(product, averageRating, reviewCount);
    }

    public static String slugify(String name) {
        String s = name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
        s = NON_ALNUM.matcher(s).replaceAll("-");
        s = s.replaceAll("-+", "-");
        s = s.replaceAll("^-|-$", "");
        return s;
    }

    private String normalize(String name) {
        return name == null ? null : name.trim();
    }

    private String normalizeCurrency(String priceCurrency) {
        return priceCurrency == null ? null : priceCurrency.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Category findCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private Product findProductForWrite(Long id, Long actorUserId, boolean admin) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        if (!admin && !product.getSellerId().equals(actorUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return product;
    }
}
