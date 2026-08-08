import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { Heart, Star, ShoppingBag, Package } from 'lucide-react';

interface ProductCardProps {
  product: Partial<Product> & {
    id: number;
    name: string;
    price: number;
    currency?: string;
    originalPrice?: number;
    rating?: number;
    reviewCount?: number;
    categoryName?: string;
    imageUrl?: string;
    stock?: number;
  };
  onAddToCart?: (product: Partial<Product>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'added'>('idle');

  const price = product.price || 0;
  const originalPrice = product.originalPrice || 0;
  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const rating = product.rating ?? 4.5;
  const reviewCount = product.reviewCount ?? 98;
  const inStock = product.stock === undefined || product.stock > 0;
  const currency = product.currency === 'USD' ? '$' : '₹';

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) return;
    if (onAddToCart) onAddToCart(product);
    setAddState('added');
    setTimeout(() => setAddState('idle'), 2000);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        border: `1.5px solid ${hovered ? '#d1fae5' : '#e5e7eb'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: hovered
          ? '0 8px 20px rgba(13,148,136,0.12), 0 2px 6px rgba(0,0,0,0.04)'
          : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms cubic-bezier(0.4,0,0.2,1), border-color 220ms',
      }}
    >
      {/* Discount Badge */}
      {hasDiscount && (
        <span style={{
          position: 'absolute', top: '0.625rem', left: '0.625rem',
          background: '#f97316', color: '#fff', fontWeight: 700,
          fontSize: '0.6875rem', padding: '0.2rem 0.5rem', borderRadius: '4px', zIndex: 2,
          letterSpacing: '0.02em',
        }}>
          {discountPct}% OFF
        </span>
      )}

      {/* Wishlist */}
      <button
        onClick={e => { e.stopPropagation(); setWishlisted(!wishlisted); }}
        aria-label="Add to wishlist"
        style={{
          position: 'absolute', top: '0.625rem', right: '0.625rem',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%',
          width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 2,
          color: wishlisted ? '#dc2626' : '#9ca3af',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          transition: 'all 200ms',
          transform: hovered || wishlisted ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        <Heart size={16} fill={wishlisted ? '#dc2626' : 'none'} strokeWidth={2} />
      </button>

      {/* Image Area */}
      <div style={{
        width: '100%',
        aspectRatio: '4/3',
        background: '#f9fafb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#9ca3af' }}>
            <Package size={40} strokeWidth={1.5} />
            <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ShopSphere Verified</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
        {/* Category */}
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {product.categoryName || 'General'}
        </span>

        {/* Product Name */}
        <h4 style={{
          fontSize: '0.9rem', fontWeight: 600, color: '#111827',
          lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flex: 1,
        }}>
          {product.name}
        </h4>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
            <Star size={11} fill="#f59e0b" color="#f59e0b" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>{rating.toFixed(1)}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>({reviewCount.toLocaleString()})</span>
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', marginLeft: 'auto' }}>Only {product.stock} left!</span>
          )}
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
            {currency}{price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span style={{ fontSize: '0.8125rem', color: '#9ca3af', textDecoration: 'line-through' }}>
              {currency}{originalPrice.toLocaleString()}
            </span>
          )}
          {!inStock && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: 'auto' }}>
              Out of Stock
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          style={{
            width: '100%', marginTop: '0.25rem',
            background: addState === 'added' ? '#059669' : inStock ? '#0d9488' : '#e5e7eb',
            color: inStock ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: '8px',
            padding: '0.575rem 0.875rem',
            fontWeight: 600, fontSize: '0.8375rem', fontFamily: 'inherit',
            cursor: inStock ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
            transition: 'background 200ms, transform 120ms',
            transform: 'scale(1)',
          }}
          onMouseEnter={e => { if (inStock && addState === 'idle') (e.currentTarget as HTMLElement).style.background = '#0f766e'; }}
          onMouseLeave={e => { if (inStock && addState === 'idle') (e.currentTarget as HTMLElement).style.background = '#0d9488'; }}
          className="btn-press"
        >
          <ShoppingBag size={14} strokeWidth={2.2} />
          {addState === 'added' ? 'Added to Cart ✓' : inStock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};
