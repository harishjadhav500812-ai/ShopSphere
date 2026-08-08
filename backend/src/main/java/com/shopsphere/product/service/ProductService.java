package com.shopsphere.product.service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.product.domain.Product;
import com.shopsphere.product.dto.CreateProductRequest;
import com.shopsphere.product.dto.ProductResponse;
import com.shopsphere.product.mapper.ProductMapper;
import com.shopsphere.product.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\-]");

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
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

        Product product = new Product(name, slug, request.description(), request.price(), sellerId);
        Product saved = productRepository.save(product);
        return ProductMapper.toResponse(saved);
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
}
