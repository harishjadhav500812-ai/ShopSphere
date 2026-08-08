import React from 'react';
import type { Category } from '../../types';
import { Filter, Star, Check, RotateCcw } from 'lucide-react';

interface FilterState {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  minRating?: number;
}

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const handleCategorySelect = (id?: number) => {
    onFilterChange({ ...filters, categoryId: id });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const hasActiveFilters =
    filters.categoryId !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStockOnly ||
    filters.minRating !== undefined;

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Filter Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} style={{ color: '#4f46e5' }} /> Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <RotateCcw size={12} /> Clear
          </button>
        )}
      </div>

      {/* Category Section */}
      <div>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Department</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <button
            onClick={() => handleCategorySelect(undefined)}
            style={{
              textAlign: 'left',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              border: 'none',
              background: filters.categoryId === undefined ? '#eef2ff' : 'transparent',
              color: filters.categoryId === undefined ? '#4f46e5' : '#475569',
              fontWeight: filters.categoryId === undefined ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            All Departments
          </button>

          {categories.map((cat) => {
            const isSelected = filters.categoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  border: 'none',
                  background: isSelected ? '#eef2ff' : 'transparent',
                  color: isSelected ? '#4f46e5' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{cat.name}</span>
                {isSelected && <Check size={14} style={{ color: '#4f46e5' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Filter Section */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Price Range</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'All Prices', min: undefined, max: undefined },
            { label: 'Under ₹500', min: undefined, max: 500 },
            { label: '₹500 – ₹2,500', min: 500, max: 2500 },
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
                  fontSize: '0.875rem',
                  color: isSelected ? '#4f46e5' : '#475569',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={isSelected}
                  onChange={() => handlePricePreset(preset.min, preset.max)}
                  style={{ accentColor: '#4f46e5' }}
                />
                {preset.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Stock Availability */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!filters.inStockOnly}
            onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
            style={{ width: '16px', height: '16px', accentColor: '#4f46e5' }}
          />
          Exclude Out of Stock
        </label>
      </div>

      {/* Rating Filter */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Customer Rating</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[4, 3, 2].map((stars) => {
            const isSelected = filters.minRating === stars;
            return (
              <button
                key={stars}
                onClick={() => onFilterChange({ ...filters, minRating: isSelected ? undefined : stars })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  background: isSelected ? '#fffbeb' : 'transparent',
                  border: isSelected ? '1px solid #fde68a' : '1px solid transparent',
                  padding: '0.375rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', gap: '0.1rem', color: '#f59e0b' }}>
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} size={13} fill="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontWeight: 600 }}>& Up</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
