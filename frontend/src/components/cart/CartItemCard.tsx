import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../utils/format';
import { Trash2, Heart, Package, Star, ShieldCheck, Truck, AlertCircle, Minus, Plus } from 'lucide-react';

export interface CartItemData {
  id: number;
  productId: number;
  name: string;
  categoryName?: string;
  price: number;
  currency?: string;
  originalPrice?: number;
  quantity: number;
  stock?: number;
  available?: boolean;
  imageUrl?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface CartItemCardProps {
  item: CartItemData;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  onMoveToWishlist?: (id: number) => void;
  isUpdating?: boolean;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist,
  isUpdating = false,
}) => {
  const [wishlisted, setWishlisted] = useState(false);
  const [removing, setRemoving] = useState(false);

  const price = item.price || 0;
  const originalPrice = item.originalPrice && item.originalPrice > price ? item.originalPrice : 0;
  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const itemTotal = price * item.quantity;
  const unavailable = item.available === false || (item.stock !== undefined && item.stock <= 0);

  const stockLimit = item.stock !== undefined ? item.stock : 99;
  const isMaxStockReached = item.quantity >= stockLimit;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 220);
  };

  const handleWishlistToggle = () => {
    setWishlisted(!wishlisted);
    if (onMoveToWishlist) {
      onMoveToWishlist(item.id);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: unavailable ? '1.5px solid #fecaca' : '1.5px solid #e5e7eb',
        borderRadius: '14px',
        padding: 'clamp(1rem, 2.5vw, 1.35rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        opacity: removing ? 0 : 1,
        transform: removing ? 'scale(0.97) translateX(-12px)' : 'scale(1) translateX(0)',
        transition: 'opacity 220ms ease, transform 220ms ease, border-color 200ms ease',
        position: 'relative'
      }}
    >
      {/* ── Main Info Row ── */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Product Image */}
        <Link to={`/products/${item.productId}`} style={{ flexShrink: 0, textDecoration: 'none' }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: '10px',
              border: '1px solid #f3f4f6',
              background: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
              />
            ) : (
              <Package size={36} color="#d1d5db" strokeWidth={1.5} />
            )}
            {hasDiscount && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.625rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.35rem',
                  borderRadius: '4px'
                }}
              >
                {discountPct}% OFF
              </div>
            )}
          </div>
        </Link>

        {/* Product Meta & Title */}
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#0d9488',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#f0fdfa',
                border: '1px solid #ccfbf1',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {item.categoryName || 'Product'}
            </span>

            {/* Stock Badge */}
            {unavailable ? (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <AlertCircle size={12} /> Out of stock
              </span>
            ) : item.stock !== undefined && item.stock <= 5 ? (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                Only {item.stock} left in stock
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                In Stock
              </span>
            )}
          </div>

          <Link
            to={`/products/${item.productId}`}
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.35,
              textDecoration: 'none',
              transition: 'color 150ms'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0d9488')}
            onMouseLeave={e => (e.currentTarget.style.color = '#111827')}
          >
            {item.name}
          </Link>

          {/* Rating */}
          {item.averageRating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78125rem', color: '#4b5563' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: '#fef9c3', color: '#a16207', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem' }}>
                <Star size={11} fill="#a16207" color="#a16207" />
                {item.averageRating.toFixed(1)}
              </div>
              {item.reviewCount ? <span style={{ color: '#9ca3af' }}>({item.reviewCount} ratings)</span> : null}
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>ShopSphere Verified Item</div>
          )}

          {/* Pricing Row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
              {formatMoney(price, item.currency)}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: '0.875rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                {formatMoney(originalPrice, item.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Item Line Total (Right alignment on desktop) */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'auto' }}>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.25rem' }}>Total</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0d9488' }}>
            {formatMoney(itemTotal, item.currency)}
          </div>
        </div>

      </div>

      {/* ── Controls & Actions Bar ── */}
      <div
        style={{
          borderTop: '1px solid #f3f4f6',
          paddingTop: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Quantity Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4b5563' }}>Qty:</span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f9fafb',
              border: '1.5px solid #d1d5db',
              borderRadius: '8px',
              overflow: 'hidden',
              opacity: isUpdating ? 0.6 : 1
            }}
          >
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating || unavailable}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem 0.65rem',
                cursor: item.quantity <= 1 || isUpdating || unavailable ? 'not-allowed' : 'pointer',
                color: item.quantity <= 1 ? '#9ca3af' : '#111827',
                display: 'flex',
                alignItems: 'center',
                justify: 'center'
              }}
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>

            <span
              style={{
                minWidth: '32px',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 800,
                color: '#111827',
                padding: '0 0.25rem'
              }}
            >
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isMaxStockReached || isUpdating || unavailable}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.4rem 0.65rem',
                cursor: isMaxStockReached || isUpdating || unavailable ? 'not-allowed' : 'pointer',
                color: isMaxStockReached ? '#9ca3af' : '#111827',
                display: 'flex',
                alignItems: 'center',
                justify: 'center'
              }}
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          {isMaxStockReached && !unavailable && (
            <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600 }}>Max stock limit</span>
          )}
        </div>

        {/* Secondary Card Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            type="button"
            onClick={handleWishlistToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: wishlisted ? '#dc2626' : '#4b5563',
              transition: 'color 160ms'
            }}
          >
            <Heart size={15} fill={wishlisted ? '#dc2626' : 'none'} color={wishlisted ? '#dc2626' : '#4b5563'} />
            {wishlisted ? 'Saved to Wishlist' : 'Move to Wishlist'}
          </button>

          <div style={{ width: 1, height: 16, background: '#e5e7eb' }} />

          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#6b7280',
              transition: 'color 160ms'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </div>

      {/* ── Offers & Guarantee Banner ── */}
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #f3f4f6',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: '#4b5563'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Truck size={14} color="#0d9488" />
          <span>Eligible for <strong>Free Delivery</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <ShieldCheck size={14} color="#0f766e" />
          <span>ShopSphere Buyer Protection Guarantee</span>
        </div>
      </div>

    </div>
  );
};
