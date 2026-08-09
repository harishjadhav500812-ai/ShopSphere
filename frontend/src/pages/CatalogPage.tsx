import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import { ProductFilters } from '../components/catalog/ProductFilters';
import { SortControl } from '../components/catalog/SortControl';
import { Pagination } from '../components/catalog/Pagination';
import { CatalogSkeleton } from '../components/catalog/CatalogSkeleton';
import { MobileFilterDrawer } from '../components/catalog/MobileFilterDrawer';
import { X, SlidersHorizontal, Search, RefreshCw, ShoppingBag } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const categoryIdParam = searchParams.get('categoryId');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const sortParam = searchParams.get('sort') || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);

  const categoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : undefined;
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch Categories and Products
  useEffect(() => {
    categoryApi
      .getAllCategories()
      .then((res) => setCategories(res))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);

    productApi
      .getProducts({
        categoryId,
        search: searchQuery || undefined,
        activeOnly: true,
      })
      .then((products) => {
        setRawProducts(products);
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, categoryId]);

  // Derived Filter & Sort Processing
  const filteredProducts = useMemo(() => {
    let result = [...rawProducts];

    if (minPrice !== undefined) {
      result = result.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      result = result.filter((p) => p.price <= maxPrice);
    }

    if (sortParam === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortParam === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortParam === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortParam === 'newest') {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [rawProducts, minPrice, maxPrice, sortParam]);

  const pageSize = 12;
  const totalElements = filteredProducts.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const currentPage = Math.min(pageParam, Math.max(0, totalPages - 1));

  const paginatedProducts = useMemo(() => {
    const start = currentPage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const updateFilters = (newFilters: {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const newParams = new URLSearchParams(searchParams);
    if (newFilters.categoryId !== undefined) {
      newParams.set('categoryId', newFilters.categoryId.toString());
    } else {
      newParams.delete('categoryId');
    }

    if (newFilters.minPrice !== undefined) {
      newParams.set('minPrice', newFilters.minPrice.toString());
    } else {
      newParams.delete('minPrice');
    }

    if (newFilters.maxPrice !== undefined) {
      newParams.set('maxPrice', newFilters.maxPrice.toString());
    } else {
      newParams.delete('maxPrice');
    }

    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeCategory = categories.find((c) => c.id === categoryId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Catalog</span>
        {activeCategory && (
          <>
            <span>/</span>
            <span style={{ color: '#0d9488', fontWeight: 600 }}>{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            {activeCategory ? activeCategory.name : searchQuery ? `Search: "${searchQuery}"` : 'All Products'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
            Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} available
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            style={{ display: 'inline-flex', gap: '0.375rem' }}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={16} /> Filters & Sort
          </Button>

          <SortControl value={sortParam} onChange={handleSortChange} />
        </div>
      </div>

      {/* Active Filter Tags */}
      {(searchQuery || categoryId || minPrice !== undefined || maxPrice !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '0.625rem 1rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Active Filters:</span>
          {searchQuery && (
            <span className="badge" style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1' }}>
              Search: "{searchQuery}"
              <X size={12} style={{ cursor: 'pointer', marginLeft: '0.25rem' }} onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('search');
                setSearchParams(p);
              }} />
            </span>
          )}
          {activeCategory && (
            <span className="badge" style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1' }}>
              Category: {activeCategory.name}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '0.25rem' }} onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('categoryId');
                setSearchParams(p);
              }} />
            </span>
          )}
          {(minPrice !== undefined || maxPrice !== undefined) && (
            <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              Price: {minPrice ? `₹${minPrice}` : '₹0'} – {maxPrice ? `₹${maxPrice}` : 'Above'}
              <X size={12} style={{ cursor: 'pointer', marginLeft: '0.25rem' }} onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete('minPrice');
                p.delete('maxPrice');
                setSearchParams(p);
              }} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Catalog Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Desktop Filter Sidebar */}
        <div className="desktop-only" style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem' }}>
          <ProductFilters
            categories={categories}
            filters={{ categoryId, minPrice, maxPrice }}
            onFilterChange={updateFilters}
            onClearFilters={clearAllFilters}
          />
        </div>

        {/* Product Grid Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <CatalogSkeleton count={8} />
          ) : isError ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: '#dc2626', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <ShoppingBag size={48} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                We couldn't load products right now
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                Please check your internet connection or try refreshing the page.
              </p>
              <Button variant="primary" onClick={() => window.location.reload()} style={{ display: 'inline-flex', gap: '0.5rem' }}>
                <RefreshCw size={16} /> Try Again
              </Button>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#9ca3af' }}>
                <Search size={54} />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
                No products found
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
                We couldn't find any products matching your selected search terms or filters.
              </p>
              <Button variant="secondary" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))', gap: '1.25rem' }}>
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categories.find((c) => c.id === product.categoryId)?.name}
                  />
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer isOpen={isMobileFilterOpen} onClose={() => setIsMobileFilterOpen(false)}>
        <ProductFilters
          categories={categories}
          filters={{ categoryId, minPrice, maxPrice }}
          onFilterChange={(f) => {
            updateFilters(f);
            setIsMobileFilterOpen(false);
          }}
          onClearFilters={() => {
            clearAllFilters();
            setIsMobileFilterOpen(false);
          }}
        />
      </MobileFilterDrawer>

    </div>
  );
};
