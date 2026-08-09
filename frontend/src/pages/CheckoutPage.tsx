import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/Button';
import { formatMoney } from '../utils/format';
import { ArrowLeft, Tag } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const items = cart?.items ?? [];
  const currency = items[0]?.priceCurrency;
  const subtotal = cart?.totals?.[currency ?? ''] ?? items.reduce((acc, i) => acc + i.priceAmount * i.quantity, 0);

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    setErrorMessage('');
    try {
      const order = await orderApi.createOrder(couponCode.trim() ? { couponCode: couponCode.trim() } : {});
      await refresh();
      navigate(`/checkout/payment/${order.id}`, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Your cart is empty</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Add products to your cart before checking out.</p>
        <Link to="/products">
          <Button variant="primary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
      {/* Order items */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>Review Your Items</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {items.map((item) => (
            <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.875rem' }}>
              <div>
                <Link to={`/products/${item.productId}`} style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', textDecoration: 'none' }}>
                  {item.productName}
                </Link>
                <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                  SKU: {item.sku} · Qty: {item.quantity}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(item.priceAmount * item.quantity, item.priceCurrency)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + coupon */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', position: 'sticky', top: '5rem' }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>Checkout Summary</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '1rem' }}>
          <span style={{ color: '#6b7280' }}>Subtotal</span>
          <span style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(subtotal, currency)}</span>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
            Coupon code (optional)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. SAVE10"
              className="input-field"
              style={{ flex: 1 }}
            />
            <Tag size={18} style={{ color: '#0d9488', alignSelf: 'center' }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.375rem' }}>
            Discounts and taxes are calculated by the server when the order is placed.
          </p>
        </div>

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <strong>!</strong> {errorMessage}
          </div>
        )}

        <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={handlePlaceOrder} isLoading={isPlacing}>
          {isPlacing ? 'Placing Order...' : 'Place Order'}
        </Button>

        <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#0d9488' }}>
          <ArrowLeft size={14} /> Back to Cart
        </Link>
      </div>
    </div>
  );
};
