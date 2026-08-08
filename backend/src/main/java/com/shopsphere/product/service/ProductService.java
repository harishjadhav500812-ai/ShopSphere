package com.shopsphere.product.service;

import java.util.List;
import java.util.Locale;
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

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\-]");

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listAll() {
        return productRepository.findAll()
                .stream()
                .map(ProductMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return ProductMapper.toResponse(p);
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
        Product saved = productRepository.save(product);
        return ProductMapper.toResponse(saved);
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
        product.setCategory(findCategory(request.categoryId()));

        return ProductMapper.toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateStatus(Long id, boolean active, Long actorUserId, boolean admin) {
        Product product = findProductForWrite(id, actorUserId, admin);
        product.setActive(active);
        return ProductMapper.toResponse(productRepository.save(product));
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
        return ProductMapper.toResponse(productRepository.save(product));
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
