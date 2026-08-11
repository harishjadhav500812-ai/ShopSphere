package com.shopsphere.product.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.shopsphere.product.dto.CreateProductRequest;
import com.shopsphere.product.dto.ProductResponse;
import com.shopsphere.product.dto.SearchSuggestionsResponse;
import com.shopsphere.product.dto.UpdateProductRequest;
import com.shopsphere.product.dto.UpdateProductStatusRequest;
import com.shopsphere.product.dto.UpdateProductStockRequest;
import com.shopsphere.product.service.ProductService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    private Long currentUserId(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        Number uid = jwt.getClaim("userId");
        return uid == null ? null : uid.longValue();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<ProductResponse> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Boolean inStockOnly,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Boolean activeOnly
    ) {
        return productService.listFiltered(categoryId, search, minPrice, maxPrice, minRating, inStockOnly, brand, sort, activeOnly);
    }

    @GetMapping(path = "/search/suggestions", produces = MediaType.APPLICATION_JSON_VALUE)
    public SearchSuggestionsResponse searchSuggestions(@RequestParam(name = "q", defaultValue = "") String query) {
        return productService.getSearchSuggestions(query);
    }

    @GetMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody CreateProductRequest request, Authentication authentication) {
        return productService.create(request, currentUserId(authentication));
    }

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody UpdateProductRequest request, Authentication authentication) {
        return productService.update(id, request, currentUserId(authentication), isAdmin(authentication));
    }

    @PatchMapping(path = "/{id}/status", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ProductResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateProductStatusRequest request, Authentication authentication) {
        return productService.updateStatus(id, request.active(), currentUserId(authentication), isAdmin(authentication));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication authentication) {
        productService.softDelete(id, currentUserId(authentication), isAdmin(authentication));
    }

    @PostMapping(path = "/{id}/stock", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ProductResponse updateStock(@PathVariable Long id, @Valid @RequestBody UpdateProductStockRequest request, Authentication authentication) {
        return productService.updateStock(id, request.quantity(), currentUserId(authentication), isAdmin(authentication));
    }
}
