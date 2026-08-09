import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import { cartApi } from '../../api/cartApi';
import { wishlistApi } from '../../api/wishlistApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatMoney } from '../../utils/format';
import { Heart, Star, ShoppingBag, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, categoryName }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [addState, setAddState] = useState<'idle' | 'added' | 'error'>('idle');

  const price = product.price || 0;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const inStock = product.stock > 0;

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inStock) return;
    if (!isAuthenticated || user?.role !== 'CUSTOMER') {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }
    try {
      await cartApi.addItem({ productId: product.id, quantity: 1 });
      await refreshCart();
      setAddState('added');
    } catch {
      setAddState('error');
    }
    setTimeout(() => setAddState('idle'), 2000);
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || user?.role !== 'CUSTOMER') {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }
    if (!wishlisted) {
      try {
        await wishlistApi.addItem({ productId: product.id });
        setWishlisted(true);
      } catch {
        /* keep UI state unchanged on failure */
      }
    } else {
      navigate('/wishlist');
    }
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
      {/* Wishlist */}
      <button
        onClick={handleWishlistToggle}
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
          {categoryName || 'General'}
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
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>({reviewCount.toLocaleString()})</span>
          {product.stock <= 5 && product.stock > 0 && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', marginLeft: 'auto' }}>Only {product.stock} left!</span>
          )}
        </div>

        {/* Price Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#111827' }}>
            {formatMoney(price, product.priceCurrency)}
          </span>
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
          {addState === 'added' ? 'Added to Cart ✓' : addState === 'error' ? 'Failed — Retry' : inStock ? 'Add to Cart' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};
