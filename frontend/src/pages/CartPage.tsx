import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import { productApi } from '../api/productApi';
import { wishlistApi } from '../api/wishlistApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { CartItemData } from '../components/cart/CartItemCard';
import { CartItemCard } from '../components/cart/CartItemCard';
import { CartSummary } from '../components/cart/CartSummary';
import { CartEmptyState } from '../components/cart/CartEmptyState';
import { CartSkeleton } from '../components/cart/CartSkeleton';
import { MobileCheckoutBar } from '../components/cart/MobileCheckoutBar';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import type { Product } from '../types';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, isLoading, refresh } = useCart();

  const [removedItemBackup, setRemovedItemBackup] = useState<{ item: CartItemData; quantity: number } | null>(null);
  const [undoMessage, setUndoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!isCustomer) return;
    productApi
      .getProducts({ activeOnly: true })
      .then(products => {
        const inCart = new Set((cart?.items ?? []).map(i => i.productId));
        setRecommendations(products.filter(p => !inCart.has(p.id) && p.stock > 0).slice(0, 4));
      })
      .catch(() => setRecommendations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  const items: CartItemData[] = (cart?.items ?? []).map(i => ({
    id: i.itemId,
    productId: i.productId,
    name: i.productName,
    price: i.priceAmount,
    currency: i.priceCurrency,
    quantity: i.quantity,
    available: i.available,
  }));

  const currency = cart?.items?.[0]?.priceCurrency;
  const subtotal = cart?.totals?.[currency ?? ''] ?? items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal;

  const runMutation = async (operation: () => Promise<unknown>, failureMessage: string) => {
    setIsMutating(true);
    setErrorMessage('');
    try {
      await operation();
      await refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : failureMessage);
    } finally {
      setIsMutating(false);
    }
  };

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    void runMutation(() => cartApi.updateItemQuantity(id, { quantity: newQuantity }), 'Could not update the item quantity.');
  };

  const handleRemoveItem = (id: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    setRemovedItemBackup({ item: target, quantity: target.quantity });
    setUndoMessage(`Removed "${target.name}" from your cart.`);
    void runMutation(() => cartApi.removeItem(id), 'Could not remove the item.');
    setTimeout(() => setUndoMessage(''), 5000);
  };

  const handleUndoRemove = () => {
    if (!removedItemBackup) return;
    const { item, quantity } = removedItemBackup;
    setRemovedItemBackup(null);
    setUndoMessage('');
    void runMutation(() => cartApi.addItem({ productId: item.productId, quantity }), 'Could not restore the item.');
  };

  const handleMoveToWishlist = (id: number) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    wishlistApi.addItem({ productId: target.productId }).catch(() => setErrorMessage('Could not save the item to your wishlist.'));
  };

  const handleClearCart = () => {
    void runMutation(() => cartApi.clearCart(), 'Could not clear the cart.');
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  if (!isAuthenticated) {
    return <CartEmptyState />;
  }

  if (!isCustomer) {
    return (
      <div style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Shopping cart is available for customer accounts</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Sign in with a customer account to manage your cart.</p>
      </div>
    );
  }

  if (isLoading && !cart) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>

      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#6b7280', textDecoration: 'none' }}>Catalog</Link>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Shopping Cart</span>
      </nav>

      {/* Cart Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            Shopping Cart <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>{items.length} items</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
            Review your order items before proceeding to checkout
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/products">
            <Button variant="ghost" size="sm" style={{ display: 'inline-flex', gap: '0.375rem' }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Button>
          </Link>
          <button
            onClick={handleClearCart}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {/* Undo Toast Notification Banner */}
      {undoMessage && (
        <div style={{ background: '#111827', color: '#ffffff', padding: '0.875rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{undoMessage}</span>
          <button
            onClick={handleUndoRemove}
            style={{ background: '#0d9488', border: 'none', color: '#ffffff', padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      )}

      {/* 2-Column Main Cart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>

        {/* Left Column: Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
              onMoveToWishlist={handleMoveToWishlist}
            />
          ))}
        </div>

        {/* Right Column: Order Summary Card */}
        <div>
          <CartSummary
            subtotal={subtotal}
            discount={0}
            tax={0}
            total={total}
            currency={currency}
            onProceedToCheckout={handleProceedToCheckout}
            isLoading={isMutating}
          />
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <section style={{ marginTop: '3.5rem', borderTop: '1.5px solid #e5e7eb', paddingTop: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>You May Also Like</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Explore more items from the catalog</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Checkout Bar */}
      <MobileCheckoutBar total={total} currency={currency} onProceedToCheckout={handleProceedToCheckout} isLoading={isMutating} />

    </div>
  );
};
