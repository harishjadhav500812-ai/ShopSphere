package com.shopsphere.category.service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.shopsphere.category.domain.Category;
import com.shopsphere.category.dto.CategoryResponse;
import com.shopsphere.category.dto.CreateCategoryRequest;
import com.shopsphere.category.dto.UpdateCategoryRequest;
import com.shopsphere.category.mapper.CategoryMapper;
import com.shopsphere.category.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9\\-]");

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepository.findAll()
                .stream()
                .map(CategoryMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        return CategoryMapper.toResponse(c);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        Category c = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        return CategoryMapper.toResponse(c);
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request) {
        String name = normalizeName(request.name());
        String slug = slugify(name);
        if (categoryRepository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category slug already exists");
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent category not found"));
        }

        Category category = new Category(name, slug, request.description(), parent);
        Category saved = categoryRepository.save(category);
        return CategoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, UpdateCategoryRequest request) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        String name = normalizeName(request.name());
        String slug = slugify(name);
        if (categoryRepository.existsBySlug(slug) && !slug.equals(existing.getSlug())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category slug already exists");
        }

        if (request.parentId() != null && request.parentId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category cannot be its own parent");
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parent category not found"));

            // prevent circular relationships
            Category p = parent;
            while (p != null) {
                if (p.getId() != null && p.getId().equals(id)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Circular parent relationship detected");
                }
                p = p.getParent();
            }
        }

        existing.setName(name);
        existing.setSlug(slug);
        existing.setDescription(request.description());
        existing.setParent(parent);

        Category saved = categoryRepository.save(existing);
        return CategoryMapper.toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        Category existing = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        if (categoryRepository.existsByParentId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category has child categories");
        }

        categoryRepository.delete(existing);
    }

    public static String slugify(String name) {
        String s = name.trim().toLowerCase(Locale.ROOT);
        // replace non-alphanumeric with hyphen
        s = NON_ALNUM.matcher(s).replaceAll("-");
        // collapse multiple hyphens
        s = s.replaceAll("-+", "-");
        // trim hyphens
        s = s.replaceAll("^-|-$", "");
        return s;
    }

    private String normalizeName(String name) {
        return name == null ? null : name.trim();
    }
}
