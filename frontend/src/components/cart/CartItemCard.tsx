import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuantitySelector } from '../product/QuantitySelector';
import { formatMoney } from '../../utils/format';
import { Trash2, Heart, Package } from 'lucide-react';

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
}

interface CartItemCardProps {
  item: CartItemData;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
  onMoveToWishlist?: (id: number) => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove, onMoveToWishlist }) => {
  const [wishlisted, setWishlisted] = useState(false);
  const [removing, setRemoving] = useState(false);

  const price = item.price || 0;
  const originalPrice = item.originalPrice && item.originalPrice > price ? item.originalPrice : 0;
  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const itemTotal = price * item.quantity;
  const unavailable = item.available === false;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item.id), 220);
  };

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e5e7eb',
      borderRadius: '12px',
      padding: 'clamp(0.875rem, 2vw, 1.25rem)',
      display: 'flex',
      gap: 'clamp(0.875rem, 2vw, 1.25rem)',
      alignItems: 'flex-start',
      opacity: removing ? 0 : 1,
      transform: removing ? 'scale(0.97) translateX(-8px)' : 'scale(1) translateX(0)',
      transition: 'opacity 220ms ease, transform 220ms ease',
      flexWrap: 'wrap',
    }}>

      {/* Product Image */}
      <Link to={`/products/${item.productId}`} style={{ flexShrink: 0 }}>
        <div style={{ width: 88, height: 88, borderRadius: '9px', border: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <Package size={32} color="#d1d5db" strokeWidth={1.5} />
          )}
        </div>
      </Link>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {item.categoryName || 'Product'}
          </span>
          <Link to={`/products/${item.productId}`} style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 700, color: '#111827', lineHeight: 1.35, marginTop: '0.1rem', transition: 'color 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#0d9488')}
            onMouseLeave={e => (e.currentTarget.style.color = '#111827')}>
            {item.name}
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111827' }}>{formatMoney(price, item.currency)}</span>
          {hasDiscount && (
            <>
              <span style={{ fontSize: '0.8125rem', color: '#9ca3af', textDecoration: 'line-through' }}>{formatMoney(originalPrice, item.currency)}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{discountPct}% OFF</span>
            </>
          )}
          {unavailable && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Currently unavailable</span>
          )}
        </div>

        {/* Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.25rem' }}>
          <QuantitySelector quantity={item.quantity} maxQuantity={item.stock || 10} onChange={q => onUpdateQuantity(item.id, q)} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setWishlisted(!wishlisted); if (onMoveToWishlist) onMoveToWishlist(item.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: wishlisted ? '#dc2626' : '#6b7280', transition: 'color 160ms' }}
            >
              <Heart size={14} fill={wishlisted ? '#dc2626' : 'none'} />
              {wishlisted ? 'Saved' : 'Wishlist'}
            </button>
            <div style={{ width: 1, height: 14, background: '#e5e7eb' }} />
            <button
              type="button"
              onClick={handleRemove}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280', transition: 'color 160ms' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </div>
      </div>

      {/* Item Total */}
      <div style={{ textAlign: 'right', alignSelf: 'center', minWidth: 80 }}>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500, marginBottom: '0.2rem' }}>Item Total</div>
        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0d9488' }}>{formatMoney(itemTotal, item.currency)}</div>
      </div>
    </div>
  );
};
