import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { formatMoney } from '../../utils/format';
import { useCart } from '../../context/CartContext';
import { wishlistApi } from '../../api/wishlistApi';
import { Button } from '../ui/Button';
import { Package, Star, Heart, ShoppingBag, Check } from 'lucide-react';

interface ProductListItemProps {
  product: Product;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ product }) => {
  const { addItem, isAdding } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);

  const price = product.price || 0;
  const originalPrice = price > 0 ? Math.round(price * 1.2) : 0;
  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem({ productId: product.id, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // handled by context error state
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
    try {
      await wishlistApi.addItem({ productId: product.id });
    } catch {
      // ignore
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '14px',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        transition: 'all 200ms ease',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        flexWrap: 'wrap'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#0d9488';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
      }}
    >
      {/* Product Image Thumbnail */}
      <Link to={`/products/${product.id}`} style={{ flexShrink: 0, position: 'relative' }}>
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '10px',
            border: '1px solid #f3f4f6',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            overflow: 'hidden'
          }}
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
          ) : (
            <Package size={40} color="#d1d5db" strokeWidth={1.5} />
          )}
        </div>
        {hasDiscount && (
          <span style={{ position: 'absolute', top: 6, left: 6, background: '#dc2626', color: '#fff', fontSize: '0.625rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
            {discountPct}% OFF
          </span>
        )}
      </Link>

      {/* Product Information */}
      <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', background: '#f0fdfa', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid #ccfbf1' }}>
            ShopSphere Item
          </span>
          {product.stock > 0 ? (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>In Stock</span>
          ) : (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Out of Stock</span>
          )}
        </div>

        <Link to={`/products/${product.id}`} style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827', textDecoration: 'none', lineHeight: 1.3 }}>
          {product.name}
        </Link>

        {product.description && (
          <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: '#fef9c3', color: '#a16207', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px', fontSize: '0.72rem' }}>
            <Star size={11} fill="#a16207" color="#a16207" />
            {product.averageRating ? product.averageRating.toFixed(1) : '4.5'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>({product.reviewCount || 12} reviews)</span>
        </div>
      </div>

      {/* Right Price & Actions Column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: '0.75rem', minWidth: 160, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>
            {formatMoney(price, product.priceCurrency)}
          </div>
          {hasDiscount && (
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af', textDecoration: 'line-through' }}>
              {formatMoney(originalPrice, product.priceCurrency)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
          <button
            onClick={handleWishlistToggle}
            style={{
              background: wishlisted ? '#fef2f2' : '#f3f4f6',
              border: 'none',
              borderRadius: '8px',
              padding: '0.55rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: wishlisted ? '#dc2626' : '#6b7280',
              transition: 'all 150ms'
            }}
            aria-label="Wishlist"
          >
            <Heart size={16} fill={wishlisted ? '#dc2626' : 'none'} />
          </button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            isLoading={isAdding}
            disabled={product.stock <= 0}
            style={{ display: 'inline-flex', gap: '0.35rem', fontWeight: 700 }}
          >
            {added ? <Check size={15} /> : <ShoppingBag size={15} />}
            {added ? 'Added' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};
