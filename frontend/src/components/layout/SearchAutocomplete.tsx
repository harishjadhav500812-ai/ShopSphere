import React, { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import type { Category, SearchSuggestionsResponse, ProductSuggestionDto, CategorySuggestionDto } from '../../types';
import { formatMoney } from '../../utils/format';
import {
  Search, X, Loader2, Clock, TrendingUp, Package, Folder, Tag, ChevronRight, AlertCircle, Trash2
} from 'lucide-react';

interface SearchAutocompleteProps {
  categories: Category[];
  isMobile?: boolean;
  onNavigateMobile?: () => void;
}

const RECENT_SEARCHES_KEY = 'shopsphere_recent_searches';
const POPULAR_SEARCHES = [
  'Laptops',
  'Smartphones',
  'Headphones',
  'Gaming Mouse',
  'Men\'s Shoes',
  'Wireless Earbuds'
];

interface SelectableItem {
  id: string;
  type: 'recent' | 'popular' | 'product' | 'category' | 'brand';
  label: string;
  payload?: ProductSuggestionDto | CategorySuggestionDto | string;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  categories,
  isMobile = false,
  onNavigateMobile
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse>({
    products: [],
    categories: [],
    brands: []
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const requestIdRef = useRef(0);

  // Load Recent Searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Save query to Recent Searches
  const saveRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore local storage errors
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Debounced API search fetch
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions({ products: [], categories: [], brands: [] });
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    const currentRequestId = ++requestIdRef.current;

    const timer = setTimeout(() => {
      productApi.getSearchSuggestions(trimmed)
        .then(res => {
          if (currentRequestId === requestIdRef.current) {
            setSuggestions(res);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (currentRequestId === requestIdRef.current) {
            setIsError(true);
            setIsLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Build flat selectable list for keyboard navigation
  const selectableItems: SelectableItem[] = [];
  if (!query.trim()) {
    recentSearches.forEach((term, idx) => {
      selectableItems.push({ id: `recent-${idx}`, type: 'recent', label: term, payload: term });
    });
    POPULAR_SEARCHES.forEach((term, idx) => {
      selectableItems.push({ id: `popular-${idx}`, type: 'popular', label: term, payload: term });
    });
  } else {
    suggestions.products.forEach(p => {
      selectableItems.push({ id: `product-${p.id}`, type: 'product', label: p.name, payload: p });
    });
    suggestions.categories.forEach(c => {
      selectableItems.push({ id: `cat-${c.id}`, type: 'category', label: c.name, payload: c });
    });
    suggestions.brands.forEach((b, idx) => {
      selectableItems.push({ id: `brand-${idx}`, type: 'brand', label: b, payload: b });
    });
  }

  // Handle Selection & Navigation
  const executeSelect = (item: SelectableItem) => {
    setIsOpen(false);
    if (onNavigateMobile) onNavigateMobile();

    if (item.type === 'product') {
      const p = item.payload as ProductSuggestionDto;
      saveRecentSearch(p.name);
      navigate(`/products/${p.id}`);
    } else if (item.type === 'category') {
      const c = item.payload as CategorySuggestionDto;
      saveRecentSearch(c.name);
      navigate(`/products?categoryId=${c.id}`);
    } else if (item.type === 'brand') {
      const b = item.payload as string;
      saveRecentSearch(b);
      navigate(`/products?search=${encodeURIComponent(b)}`);
    } else {
      const term = item.payload as string;
      saveRecentSearch(term);
      setQuery(term);
      const params = new URLSearchParams();
      params.set('search', term);
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      navigate(`/products?${params.toString()}`);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < selectableItems.length) {
      executeSelect(selectableItems[selectedIndex]);
      return;
    }

    const trimmed = query.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      const params = new URLSearchParams();
      params.set('search', trimmed);
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      navigate(`/products?${params.toString()}`);
    } else {
      navigate('/products');
    }
    setIsOpen(false);
    if (onNavigateMobile) onNavigateMobile();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < selectableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : selectableItems.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Text Highlighting Helper
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} style={{ background: '#ccfbf1', color: '#0f766e', padding: '0 2px', borderRadius: '3px', fontWeight: 700 }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const hasNoResults = query.trim() && !isLoading && !isError &&
    suggestions.products.length === 0 &&
    suggestions.categories.length === 0 &&
    suggestions.brands.length === 0;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <form
        onSubmit={handleFormSubmit}
        style={{
          display: 'flex',
          alignItems: 'stretch',
          border: isOpen ? '2px solid #0d9488' : '2px solid #e5e7eb',
          borderRadius: isMobile ? '8px' : '10px',
          overflow: 'hidden',
          background: '#f9fafb',
          transition: 'all 200ms ease',
          boxShadow: isOpen ? '0 4px 12px rgba(13, 148, 136, 0.15)' : 'none'
        }}
      >
        {/* Category Dropdown (Desktop only) */}
        {!isMobile && (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRight: '1px solid #e5e7eb',
              padding: '0 0.875rem',
              fontSize: '0.8125rem',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 600,
              outline: 'none',
              maxWidth: 150
            }}
          >
            <option value="all">All Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Input Container */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', background: '#fff' }}>
          <Search size={18} color="#9ca3af" style={{ marginLeft: '0.75rem', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, brands and categories..."
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); setSelectedIndex(-1); }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '0.65rem 0.75rem',
              fontSize: '0.875rem',
              color: '#111827',
              outline: 'none',
              minWidth: 0
            }}
          />

          {/* Loading Indicator or Clear Button */}
          {isLoading ? (
            <Loader2 size={16} color="#0d9488" className="animate-spin" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
          ) : query ? (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions({ products: [], categories: [], brands: [] }); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', marginRight: '0.75rem', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          style={{
            background: '#0d9488',
            border: 'none',
            color: '#fff',
            padding: isMobile ? '0 0.875rem' : '0 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            transition: 'background 180ms ease'
          }}
        >
          <Search size={16} />
          {!isMobile && <span>Search</span>}
        </button>
      </form>

      {/* ── Dropdown Suggestions Panel ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            zIndex: 300,
            maxHeight: '440px',
            overflowY: 'auto',
            padding: '0.5rem 0'
          }}
        >

          {/* ── Empty Query Discovery State: Recent & Popular ── */}
          {!query.trim() && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSearches.length > 0 && (
                <div style={{ padding: '0.5rem 0.875rem 0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} color="#0d9488" /> Recent Searches
                    </span>
                    <button
                      onClick={clearAllRecent}
                      style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear All
                    </button>
                  </div>
                  {recentSearches.map((term, idx) => {
                    const itemIdx = idx;
                    const isSelected = selectedIndex === itemIdx;
                    return (
                      <div
                        key={term}
                        onClick={() => executeSelect({ id: `recent-${idx}`, type: 'recent', label: term, payload: term })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          padding: '0.45rem 0.625rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdfa' : 'transparent',
                          color: isSelected ? '#0d9488' : '#374151',
                          fontWeight: 500,
                          fontSize: '0.84rem',
                          transition: 'background 120ms'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} color="#9ca3af" />
                          <span>{term}</span>
                        </div>
                        <button
                          onClick={e => removeRecentSearch(e, term)}
                          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.15rem' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ padding: '0.5rem 0.875rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={13} color="#f97316" /> Popular Searches
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {POPULAR_SEARCHES.map((term, idx) => {
                    const offset = recentSearches.length;
                    const itemIdx = offset + idx;
                    const isSelected = selectedIndex === itemIdx;
                    return (
                      <button
                        key={term}
                        type="button"
                        onClick={() => executeSelect({ id: `popular-${idx}`, type: 'popular', label: term, payload: term })}
                        style={{
                          background: isSelected ? '#0d9488' : '#f3f4f6',
                          color: isSelected ? '#fff' : '#374151',
                          border: 'none',
                          borderRadius: '999px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78125rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 150ms'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                      >
                        {term}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Typing Suggestions State ── */}
          {query.trim() && (
            <div>
              {/* Product Suggestions */}
              {suggestions.products.length > 0 && (
                <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
                  <div style={{ padding: '0.5rem 0.875rem 0.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Package size={13} color="#0d9488" /> Products
                  </div>
                  {suggestions.products.map((p, idx) => {
                    const itemIdx = idx;
                    const isSelected = selectedIndex === itemIdx;
                    return (
                      <div
                        key={p.id}
                        onClick={() => executeSelect({ id: `product-${p.id}`, type: 'product', label: p.name, payload: p })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.5rem 0.875rem',
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdfa' : 'transparent',
                          borderLeft: isSelected ? '3px solid #0d9488' : '3px solid transparent',
                          transition: 'all 130ms'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <Package size={20} color="#9ca3af" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {highlightMatch(p.name, query)}
                          </div>
                          {p.categoryName && (
                            <span style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>
                              in {p.categoryName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0d9488', flexShrink: 0 }}>
                          {formatMoney(p.price, p.priceCurrency)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Category Suggestions */}
              {suggestions.categories.length > 0 && (
                <div style={{ borderBottom: '1px solid #f3f4f6', padding: '0.375rem 0' }}>
                  <div style={{ padding: '0.375rem 0.875rem 0.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Folder size={13} color="#0f766e" /> Categories
                  </div>
                  {suggestions.categories.map((cat, idx) => {
                    const itemIdx = suggestions.products.length + idx;
                    const isSelected = selectedIndex === itemIdx;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => executeSelect({ id: `cat-${cat.id}`, type: 'category', label: cat.name, payload: cat })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          padding: '0.45rem 0.875rem',
                          cursor: 'pointer',
                          background: isSelected ? '#f0fdfa' : 'transparent',
                          borderLeft: isSelected ? '3px solid #0d9488' : '3px solid transparent',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: '#374151',
                          transition: 'all 130ms'
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIdx)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Folder size={15} color="#0d9488" />
                          <span>{highlightMatch(cat.name, query)}</span>
                        </div>
                        <ChevronRight size={14} color="#9ca3af" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Brand Suggestions */}
              {suggestions.brands.length > 0 && (
                <div style={{ padding: '0.375rem 0' }}>
                  <div style={{ padding: '0.375rem 0.875rem 0.25rem', fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Tag size={13} color="#6366f1" /> Brands
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', padding: '0.25rem 0.875rem 0.5rem' }}>
                    {suggestions.brands.map((brand, idx) => {
                      const itemIdx = suggestions.products.length + suggestions.categories.length + idx;
                      const isSelected = selectedIndex === itemIdx;
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => executeSelect({ id: `brand-${idx}`, type: 'brand', label: brand, payload: brand })}
                          style={{
                            background: isSelected ? '#6366f1' : '#eeeffe',
                            color: isSelected ? '#fff' : '#4338ca',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.3rem 0.625rem',
                            fontSize: '0.78125rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 130ms'
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                        >
                          {highlightMatch(brand, query)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No Results State */}
              {hasNoResults && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                  <Package size={32} color="#9ca3af" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827' }}>
                    No products found for "{query}"
                  </div>
                  <p style={{ fontSize: '0.78125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Try searching for products, brands or categories.
                  </p>
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626', fontSize: '0.84rem' }}>
                  <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Could not load search suggestions. Press Enter to view all results.
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
