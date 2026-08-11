package com.shopsphere.product.service;

import java.math.BigDecimal;
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

import java.util.ArrayList;

import com.shopsphere.product.dto.SearchSuggestionsResponse;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ReviewService reviewService;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\-]");
    private static final List<String> KNOWN_BRANDS = List.of(
            "Apple", "Samsung", "HP", "Lenovo", "Dell", "Sony", "Bose", "Nike", "Adidas", "Asus", "Acer", "Logitech"
    );

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository, ReviewService reviewService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.reviewService = reviewService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        return listFiltered(null, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listFiltered(
            Long categoryId,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            Boolean inStockOnly,
            String brand,
            String sort,
            Boolean activeOnly
    ) {
        List<Product> products = productRepository.findAll();

        String query = search != null ? search.trim().toLowerCase(Locale.ROOT) : null;
        String brandFilter = brand != null ? brand.trim().toLowerCase(Locale.ROOT) : null;
        boolean filterActive = activeOnly != null ? activeOnly : false;
        boolean filterInStock = inStockOnly != null ? inStockOnly : false;

        List<Product> filtered = products.stream().filter(p -> {
            if (filterActive && !p.isActive()) {
                return false;
            }
            if (filterInStock && (p.getStock() == null || p.getStock() <= 0)) {
                return false;
            }
            if (categoryId != null && (p.getCategory() == null || !categoryId.equals(p.getCategory().getId()))) {
                return false;
            }
            if (minPrice != null && p.getPriceAmount().compareTo(minPrice) < 0) {
                return false;
            }
            if (maxPrice != null && p.getPriceAmount().compareTo(maxPrice) > 0) {
                return false;
            }
            if (brandFilter != null && !brandFilter.isEmpty()) {
                boolean matchNameBrand = p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(brandFilter);
                boolean matchDescBrand = p.getDescription() != null && p.getDescription().toLowerCase(Locale.ROOT).contains(brandFilter);
                if (!matchNameBrand && !matchDescBrand) {
                    return false;
                }
            }
            if (query != null && !query.isEmpty()) {
                boolean matchesName = p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(query);
                boolean matchesDesc = p.getDescription() != null && p.getDescription().toLowerCase(Locale.ROOT).contains(query);
                boolean matchesCat = p.getCategory() != null && p.getCategory().getName() != null && p.getCategory().getName().toLowerCase(Locale.ROOT).contains(query);
                boolean matchesSku = p.getSku() != null && p.getSku().toLowerCase(Locale.ROOT).contains(query);
                return matchesName || matchesDesc || matchesCat || matchesSku;
            }
            return true;
        }).toList();

        List<Long> productIds = filtered.stream().map(Product::getId).toList();
        Map<Long, ReviewService.ReviewSummary> summaries = reviewService.summariesForProducts(productIds);

        List<ProductResponse> responses = new ArrayList<>(filtered.stream()
                .map(p -> toResponseWithSummary(p, summaries.get(p.getId())))
                .filter(res -> minRating == null || (res.averageRating() != null && res.averageRating() >= minRating))
                .toList());

        // Sort handling
        if (sort != null) {
            switch (sort.toLowerCase(Locale.ROOT)) {
                case "price_asc" -> responses.sort((a, b) -> a.price().compareTo(b.price()));
                case "price_desc" -> responses.sort((a, b) -> b.price().compareTo(a.price()));
                case "rating" -> responses.sort((a, b) -> {
                    Double rA = a.averageRating() != null ? a.averageRating() : 0.0;
                    Double rB = b.averageRating() != null ? b.averageRating() : 0.0;
                    return Double.compare(rB, rA);
                });
                case "newest" -> responses.sort((a, b) -> Long.compare(b.id(), a.id()));
                default -> { /* relevance or default */ }
            }
        }

        return responses;
    }

    @Transactional(readOnly = true)
    public SearchSuggestionsResponse getSearchSuggestions(String rawQuery) {
        if (rawQuery == null || rawQuery.trim().isEmpty()) {
            return new SearchSuggestionsResponse(List.of(), List.of(), List.of());
        }

        String q = rawQuery.trim().toLowerCase(Locale.ROOT);

        // Matching products
        List<Product> allProducts = productRepository.findAll();
        List<SearchSuggestionsResponse.ProductSuggestionDto> productSuggestions = allProducts.stream()
                .filter(Product::isActive)
                .filter(p -> {
                    boolean mName = p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(q);
                    boolean mDesc = p.getDescription() != null && p.getDescription().toLowerCase(Locale.ROOT).contains(q);
                    boolean mCat = p.getCategory() != null && p.getCategory().getName() != null && p.getCategory().getName().toLowerCase(Locale.ROOT).contains(q);
                    return mName || mDesc || mCat;
                })
                .limit(5)
                .map(p -> new SearchSuggestionsResponse.ProductSuggestionDto(
                        p.getId(),
                        p.getName(),
                        p.getPriceAmount(),
                        p.getPriceCurrency(),
                        p.getImageUrl(),
                        p.getCategory() != null ? p.getCategory().getName() : null
                ))
                .toList();

        // Matching categories
        List<Category> allCategories = categoryRepository.findAll();
        List<SearchSuggestionsResponse.CategorySuggestionDto> categorySuggestions = allCategories.stream()
                .filter(c -> c.getName() != null && c.getName().toLowerCase(Locale.ROOT).contains(q))
                .limit(4)
                .map(c -> new SearchSuggestionsResponse.CategorySuggestionDto(
                        c.getId(),
                        c.getName(),
                        c.getSlug()
                ))
                .toList();

        // Matching brands
        List<String> brandSuggestions = KNOWN_BRANDS.stream()
                .filter(b -> b.toLowerCase(Locale.ROOT).contains(q) || q.contains(b.toLowerCase(Locale.ROOT)))
                .limit(4)
                .toList();

        return new SearchSuggestionsResponse(productSuggestions, categorySuggestions, brandSuggestions);
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
