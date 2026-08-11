import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/ui/ProductCard';
import { ProductListItem } from '../components/catalog/ProductListItem';
import { Button } from '../components/ui/Button';
import { ProductFilters } from '../components/catalog/ProductFilters';
import { SortControl } from '../components/catalog/SortControl';
import { Pagination } from '../components/catalog/Pagination';
import { CatalogSkeleton } from '../components/catalog/CatalogSkeleton';
import { MobileFilterDrawer } from '../components/catalog/MobileFilterDrawer';
import {
  X, SlidersHorizontal, Search, RefreshCw, ShoppingBag, LayoutGrid, List as ListIcon, Star, Filter, Tag, Check
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const searchQuery = searchParams.get('search') || '';
  const categoryIdParam = searchParams.get('categoryId');
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const minRatingParam = searchParams.get('minRating');
  const inStockOnlyParam = searchParams.get('inStockOnly') === 'true';
  const brandParam = searchParams.get('brand') || '';
  const sortParam = searchParams.get('sort') || 'relevance';
  const pageParam = parseInt(searchParams.get('page') || '0', 10);

  const categoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : undefined;
  const minPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
  const minRating = minRatingParam ? parseFloat(minRatingParam) : undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch Categories once
  useEffect(() => {
    categoryApi
      .getAllCategories()
      .then((res) => setCategories(res))
      .catch(() => setCategories([]));
  }, []);

  // Fetch Filtered Products from Backend
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);

    productApi
      .getProducts({
        categoryId,
        search: searchQuery || undefined,
        minPrice,
        maxPrice,
        minRating,
        inStockOnly: inStockOnlyParam || undefined,
        brand: brandParam || undefined,
        sort: sortParam !== 'relevance' ? sortParam : undefined,
        activeOnly: true,
      })
      .then((res) => {
        setProducts(res);
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, categoryId, minPrice, maxPrice, minRating, inStockOnlyParam, brandParam, sortParam]);

  // Pagination logic
  const pageSize = 12;
  const totalElements = products.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const currentPage = Math.min(pageParam, Math.max(0, totalPages - 1));

  const startIdx = currentPage * pageSize;
  const paginatedProducts = products.slice(startIdx, startIdx + pageSize);

  // Update filters in URL search params
  const updateFilters = (newFilters: {
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStockOnly?: boolean;
    brand?: string;
  }) => {
    const newParams = new URLSearchParams(searchParams);

    if (newFilters.categoryId !== undefined) newParams.set('categoryId', newFilters.categoryId.toString());
    else newParams.delete('categoryId');

    if (newFilters.minPrice !== undefined) newParams.set('minPrice', newFilters.minPrice.toString());
    else newParams.delete('minPrice');

    if (newFilters.maxPrice !== undefined) newParams.set('maxPrice', newFilters.maxPrice.toString());
    else newParams.delete('maxPrice');

    if (newFilters.minRating !== undefined) newParams.set('minRating', newFilters.minRating.toString());
    else newParams.delete('minRating');

    if (newFilters.inStockOnly) newParams.set('inStockOnly', 'true');
    else newParams.delete('inStockOnly');

    if (newFilters.brand) newParams.set('brand', newFilters.brand);
    else newParams.delete('brand');

    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    newParams.set('page', '0');
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

  const removeSingleFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === 'price') {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '0');
    setSearchParams(newParams);
  };

  const activeCategory = categories.find((c) => c.id === categoryId);
  const activeCount = [
    !!searchQuery,
    !!activeCategory,
    minPrice !== undefined || maxPrice !== undefined,
    minRating !== undefined,
    inStockOnlyParam,
    !!brandParam
  ].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>

      {/* ── 1. Breadcrumb Navigation ── */}
      <nav style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#6b7280', textDecoration: 'none' }}>Catalog</Link>
        {activeCategory && (
          <>
            <span>/</span>
            <span style={{ color: '#0d9488', fontWeight: 600 }}>{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* ── 2. Category / Header Section ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
          border: '1.5px solid #ccfbf1',
          borderRadius: '16px',
          padding: 'clamp(1.25rem, 3vw, 1.875rem)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 10px rgba(13,148,136,0.04)'
        }}
      >
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
            {activeCategory ? activeCategory.name : searchQuery ? `Search Results: "${searchQuery}"` : 'All Products'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
            {activeCategory
              ? activeCategory.description || `Discover the best deals, brands and products in ${activeCategory.name}.`
              : 'Explore ShopSphere\'s curated collection of products, top brands and daily deals.'}
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #ccfbf1', borderRadius: '10px', padding: '0.5rem 1rem', textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Available Items</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#0d9488' }}>
            {totalElements.toLocaleString()} products
          </div>
        </div>
      </div>

      {/* ── 3. Active Filter Chips ── */}
      {activeCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '0.75rem 1rem', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Filters ({activeCount}):
          </span>

          {searchQuery && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              Search: "{searchQuery}"
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('search')} />
            </span>
          )}

          {activeCategory && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              Category: {activeCategory.name}
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('categoryId')} />
            </span>
          )}

          {(minPrice !== undefined || maxPrice !== undefined) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              Price: {minPrice !== undefined ? `₹${minPrice}` : '₹0'} – {maxPrice !== undefined ? `₹${maxPrice}` : 'Above'}
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('price')} />
            </span>
          )}

          {minRating !== undefined && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              Rating: {minRating}★ & Up
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('minRating')} />
            </span>
          )}

          {inStockOnlyParam && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              In Stock Only
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('inStockOnly')} />
            </span>
          )}

          {brandParam && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#eeeffe', color: '#4338ca', border: '1px solid #c7d2fe', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.78125rem', fontWeight: 700 }}>
              Brand: {brandParam}
              <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeSingleFilter('brand')} />
            </span>
          )}

          <button
            onClick={clearAllFilters}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78125rem', fontWeight: 800, cursor: 'pointer', marginLeft: 'auto', textDecoration: 'underline' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── 4. Main Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '0.75rem 1.25rem', borderRadius: '12px' }}>
        
        {/* Mobile Filter Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            variant="outline"
            size="sm"
            className="mobile-only"
            style={{ display: 'inline-flex', gap: '0.375rem', fontWeight: 700 }}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={16} color="#0d9488" /> Filters {activeCount > 0 && `(${activeCount})`}
          </Button>

          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
            Showing {totalElements > 0 ? `${startIdx + 1}–${Math.min(startIdx + pageSize, totalElements)}` : '0'} of {totalElements} products
          </span>
        </div>

        {/* View Toggle & Sorting Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Grid / List View Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', background: '#f9fafb' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#0d9488' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : '#6b7280',
                border: 'none',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 150ms'
              }}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? '#0d9488' : 'transparent',
                color: viewMode === 'list' ? '#fff' : '#6b7280',
                border: 'none',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 150ms'
              }}
              aria-label="List view"
              title="List view"
            >
              <ListIcon size={16} />
            </button>
          </div>

          <SortControl value={sortParam} onChange={handleSortChange} />
        </div>
      </div>

      {/* ── 5. Main Catalog Content Area ── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'start' }}>
        
        {/* Desktop Sticky Left Filter Sidebar */}
        <div
          className="desktop-only"
          style={{
            width: '280px',
            flexShrink: 0,
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.25rem',
            position: 'sticky',
            top: '5.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}
        >
          <ProductFilters
            categories={categories}
            filters={{ categoryId, minPrice, maxPrice, minRating, inStockOnly: inStockOnlyParam, brand: brandParam }}
            onFilterChange={updateFilters}
            onClearFilters={clearAllFilters}
          />
        </div>

        {/* Product Results Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLoading ? (
            <CatalogSkeleton count={8} />
          ) : isError ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '3.5rem 2rem', textAlign: 'center' }}>
              <ShoppingBag size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Unable to load products</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Something went wrong while connecting to ShopSphere servers.</p>
              <Button variant="primary" onClick={() => window.location.reload()} style={{ display: 'inline-flex', gap: '0.5rem' }}>
                <RefreshCw size={16} /> Try Again
              </Button>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, background: '#f0fdfa', border: '2px solid #ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <Search size={34} color="#0d9488" />
              </div>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
                No products match your selected filters
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                We couldn't find any products matching your active criteria. Try clearing some filters or searching for another keyword.
              </p>
              <Button variant="primary" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Product Grid / List Container */}
              {viewMode === 'grid' ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '1.25rem'
                  }}
                >
                  {paginatedProducts.map((p) => {
                    const catName = categories.find(c => c.id === p.categoryId)?.name;
                    return <ProductCard key={p.id} product={p} categoryName={catName} />;
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {paginatedProducts.map((p) => (
                    <ProductListItem key={p.id} product={p} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filter Drawer Bottom Sheet */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        activeCount={activeCount}
        onClearAll={clearAllFilters}
      >
        <ProductFilters
          categories={categories}
          filters={{ categoryId, minPrice, maxPrice, minRating, inStockOnly: inStockOnlyParam, brand: brandParam }}
          onFilterChange={(f) => { updateFilters(f); }}
          onClearFilters={clearAllFilters}
        />
      </MobileFilterDrawer>

    </div>
  );
};
