import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistApi } from '../api/wishlistApi';
import { cartApi } from '../api/cartApi';
import { useCart } from '../context/CartContext';
import type { Wishlist } from '../types';
import { Button } from '../components/ui/Button';
import { formatMoney, formatDate } from '../utils/format';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const { refresh: refreshCart } = useCart();

  const load = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');
    wishlistApi
      .getWishlist()
      .then(setWishlist)
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load your wishlist.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (itemId: number) => {
    setBusyItemId(itemId);
    setErrorMessage('');
    try {
      const updated = await wishlistApi.removeItem(itemId);
      setWishlist(updated);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not remove the item.');
    } finally {
      setBusyItemId(null);
    }
  };

  const handleMoveToCart = async (productId: number) => {
    setBusyItemId(productId);
    setErrorMessage('');
    try {
      await cartApi.addItem({ productId, quantity: 1 });
      await refreshCart();
      setAddedProductId(productId);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not add the item to your cart.');
    } finally {
      setBusyItemId(null);
    }
  };

  const items = wishlist?.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>My Wishlist</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
          {wishlist ? `${wishlist.itemCount} item${wishlist.itemCount === 1 ? '' : 's'} saved` : 'Products you save for later'}
        </p>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading wishlist...</div>
      ) : items.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Heart size={54} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Your wishlist is empty</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Tap the heart on any product to save it here.</p>
          <Link to="/products" style={{ color: '#0d9488', fontWeight: 700 }}>Browse Products →</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {items.map((item) => (
            <div key={item.itemId} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Link to={`/products/${item.productId}`} style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', textDecoration: 'none' }}>
                  {item.productName}
                </Link>
                {!item.available && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '999px', padding: '0.125rem 0.5rem', whiteSpace: 'nowrap' }}>
                    Unavailable
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '1.0625rem' }}>{formatMoney(item.priceAmount, item.priceCurrency)}</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Added {formatDate(item.addedAt)}</span>
              </div>
              {addedProductId === item.productId && (
                <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Added to cart ✓</div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  leftIcon={<ShoppingCart size={14} />}
                  onClick={() => handleMoveToCart(item.productId)}
                  disabled={!item.available}
                  isLoading={busyItemId === item.productId}
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(item.itemId)}
                  disabled={busyItemId === item.itemId}
                  title="Remove from wishlist"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
