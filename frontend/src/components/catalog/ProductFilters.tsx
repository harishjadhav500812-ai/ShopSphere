import React, { useState } from 'react';
import type { Category } from '../../types';
import { Filter, Star, Check, RotateCcw, ChevronDown, ChevronUp, Search } from 'lucide-react';

export interface FilterState {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minRating?: number;
  brand?: string;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const ALL_BRANDS = [
  'Apple',
  'Samsung',
  'HP',
  'Lenovo',
  'Dell',
  'Sony',
  'Bose',
  'Nike',
  'Adidas',
  'Asus',
  'Acer',
  'Logitech'
];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  // Collapsible Section States
  const [openSections, setOpenSections] = useState({
    categories: true,
    price: true,
    availability: true,
    rating: true,
    brand: true
  });

  // Custom Price Input State
  const [customMin, setCustomMin] = useState<string>(filters.minPrice !== undefined ? filters.minPrice.toString() : '');
  const [customMax, setCustomMax] = useState<string>(filters.maxPrice !== undefined ? filters.maxPrice.toString() : '');
  const [priceError, setPriceError] = useState<string>('');

  // Brand Search State
  const [brandSearch, setBrandSearch] = useState<string>('');
  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategorySelect = (id?: number) => {
    onFilterChange({ ...filters, categoryId: id });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    setCustomMin(min !== undefined ? min.toString() : '');
    setCustomMax(max !== undefined ? max.toString() : '');
    setPriceError('');
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = customMin.trim() !== '' ? parseFloat(customMin) : undefined;
    const maxVal = customMax.trim() !== '' ? parseFloat(customMax) : undefined;

    if (minVal !== undefined && isNaN(minVal)) {
      setPriceError('Minimum price must be a valid number.');
      return;
    }
    if (maxVal !== undefined && isNaN(maxVal)) {
      setPriceError('Maximum price must be a valid number.');
      return;
    }
    if (minVal !== undefined && minVal < 0) {
      setPriceError('Minimum price cannot be negative.');
      return;
    }
    if (minVal !== undefined && maxVal !== undefined && maxVal < minVal) {
      setPriceError('Max price must be greater than or equal to min price.');
      return;
    }

    setPriceError('');
    onFilterChange({ ...filters, minPrice: minVal, maxPrice: maxVal });
  };

  const handleBrandToggle = (brandName: string) => {
    const isSelected = filters.brand?.toLowerCase() === brandName.toLowerCase();
    onFilterChange({ ...filters, brand: isSelected ? undefined : brandName });
  };

  const filteredBrands = ALL_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.trim().toLowerCase()));
  const displayedBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 5);

  const hasActiveFilters =
    filters.categoryId !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStockOnly ||
    filters.minRating !== undefined ||
    !!filters.brand;

  const activeCount = [
    filters.categoryId !== undefined,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.inStockOnly,
    filters.minRating !== undefined,
    !!filters.brand
  ].filter(Boolean).length;

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ── Filter Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #f3f4f6', paddingBottom: '0.875rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Filter size={18} color="#0d9488" /> Filters {activeCount > 0 && <span style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #ccfbf1', fontSize: '0.75rem', padding: '0.1rem 0.45rem', borderRadius: '999px' }}>{activeCount}</span>}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.78125rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>

      {/* ── 1. Department / Category Section ── */}
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => toggleSection('categories')}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.25rem 0' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Category / Department</span>
          {openSections.categories ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {openSections.categories && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.625rem' }}>
            <button
              onClick={() => handleCategorySelect(undefined)}
              style={{
                textAlign: 'left',
                padding: '0.45rem 0.625rem',
                borderRadius: '6px',
                fontSize: '0.84rem',
                border: 'none',
                background: filters.categoryId === undefined ? '#f0fdfa' : 'transparent',
                color: filters.categoryId === undefined ? '#0d9488' : '#374151',
                fontWeight: filters.categoryId === undefined ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Categories
            </button>

            {categories.map((cat) => {
              const isSelected = filters.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    textAlign: 'left',
                    padding: '0.45rem 0.625rem',
                    borderRadius: '6px',
                    fontSize: '0.84rem',
                    border: 'none',
                    background: isSelected ? '#f0fdfa' : 'transparent',
                    color: isSelected ? '#0d9488' : '#374151',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                  }}
                >
                  <span>{cat.name}</span>
                  {isSelected && <Check size={14} color="#0d9488" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Price Range Section ── */}
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => toggleSection('price')}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.25rem 0' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Price</span>
          {openSections.price ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {openSections.price && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.625rem' }}>
            {[
              { label: 'All Prices', min: undefined, max: undefined },
              { label: 'Under ₹500', min: undefined, max: 500 },
              { label: '₹500 – ₹1,000', min: 500, max: 1000 },
              { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
              { label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
              { label: 'Over ₹5,000', min: 5000, max: undefined },
            ].map((preset, idx) => {
              const isSelected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
              return (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.84rem',
                    color: isSelected ? '#0d9488' : '#374151',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="pricePreset"
                    checked={isSelected}
                    onChange={() => handlePricePreset(preset.min, preset.max)}
                    style={{ accentColor: '#0d9488' }}
                  />
                  {preset.label}
                </label>
              );
            })}

            {/* Custom Min / Max Form */}
            <form onSubmit={handleApplyCustomPrice} style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Custom Range</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={customMin}
                  onChange={e => setCustomMin(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.78125rem', outline: 'none' }}
                />
                <span style={{ color: '#9ca3af' }}>—</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={customMax}
                  onChange={e => setCustomMax(e.target.value)}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.78125rem', outline: 'none' }}
                />
                <button
                  type="submit"
                  style={{ background: '#0d9488', border: 'none', color: '#fff', padding: '0.35rem 0.625rem', borderRadius: '6px', fontSize: '0.78125rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  Go
                </button>
              </div>
              {priceError && <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 500 }}>{priceError}</span>}
            </form>
          </div>
        )}
      </div>

      {/* ── 3. Availability Section ── */}
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => toggleSection('availability')}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.25rem 0' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Availability</span>
          {openSections.availability ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {openSections.availability && (
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!filters.inStockOnly}
                onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
                style={{ width: '15px', height: '15px', accentColor: '#0d9488' }}
              />
              In Stock Only
            </label>
          </div>
        )}
      </div>

      {/* ── 4. Customer Rating Section ── */}
      <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => toggleSection('rating')}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.25rem 0' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Customer Rating</span>
          {openSections.rating ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {openSections.rating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.625rem' }}>
            {[4, 3, 2, 1].map((stars) => {
              const isSelected = filters.minRating === stars;
              return (
                <button
                  key={stars}
                  onClick={() => onFilterChange({ ...filters, minRating: isSelected ? undefined : stars })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    background: isSelected ? '#f0fdfa' : 'transparent',
                    border: isSelected ? '1px solid #ccfbf1' : '1px solid transparent',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    color: isSelected ? '#0d9488' : '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 130ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.1rem', color: '#f59e0b' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < stars ? '#f59e0b' : 'none'}
                          color={i < stars ? '#f59e0b' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <span style={{ fontWeight: 600 }}>& Up</span>
                  </div>
                  {isSelected && <Check size={14} color="#0d9488" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Brand Section ── */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('brand')}
          style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.25rem 0' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>Brand</span>
          {openSections.brand ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
        </button>

        {openSections.brand && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.25rem 0.5rem', background: '#fff' }}>
              <Search size={14} color="#9ca3af" style={{ marginRight: '0.35rem' }} />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: '0.78125rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
              {displayedBrands.map(b => {
                const isSelected = filters.brand?.toLowerCase() === b.toLowerCase();
                return (
                  <label
                    key={b}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.84rem',
                      color: isSelected ? '#0d9488' : '#374151',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleBrandToggle(b)}
                      style={{ width: '14px', height: '14px', accentColor: '#0d9488' }}
                    />
                    {b}
                  </label>
                );
              })}
            </div>

            {filteredBrands.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllBrands(!showAllBrands)}
                style={{ background: 'none', border: 'none', color: '#0d9488', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left', marginTop: '0.2rem' }}
              >
                {showAllBrands ? 'Show Less' : `+ Show ${filteredBrands.length - 5} More`}
              </button>
            )}
          </div>
        )}
      </div>

    </aside>
  );
};
