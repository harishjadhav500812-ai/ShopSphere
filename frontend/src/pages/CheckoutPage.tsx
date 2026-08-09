import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { shippingApi } from '../api/shippingApi';
import { useCart } from '../context/CartContext';
import { useProductLookup } from '../hooks/useProductLookup';
import { AddressSelector } from '../components/checkout/AddressSelector';
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector';
import { Button } from '../components/ui/Button';
import { formatMoney } from '../utils/format';
import type { Address, PaymentMethod } from '../types';
import { ArrowLeft, MapPin, Tag, Package, ShoppingBag, ArrowRight } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, refresh } = useCart();
  const { products } = useProductLookup();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [couponCode, setCouponCode] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const items = cart?.items ?? [];
  const currency = items[0]?.priceCurrency;
  const subtotal = cart?.totals?.[currency ?? ''] ?? items.reduce((acc, i) => acc + i.priceAmount * i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setErrorMessage('Please select or add a delivery address before placing your order.');
      return;
    }

    setIsPlacing(true);
    setErrorMessage('');
    let orderId: number | null = null;

    try {
      // 1. Create the order from the cart \u2014 server validates stock/pricing and calculates totals.
      const order = await orderApi.createOrder(couponCode.trim() ? { couponCode: couponCode.trim() } : {});
      orderId = order.id;

      // 2. Process payment (simulated processor; order moves PENDING \u2192 CONFIRMED, stock is deducted).
      await paymentApi.processPayment(order.id);

      // 3. Attach the delivery address as a shipment (order moves CONFIRMED \u2192 PROCESSING).
      await shippingApi.createShipment(order.id, {
        shippingAddress: {
          recipientName: selectedAddress.recipientName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.addressLine1,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
      });

      // 4. Cart is already cleared server-side by order creation \u2014 refresh client state (navbar count, etc).
      await refresh();

      navigate(`/orders/${order.id}/confirmation`, { replace: true, state: { paymentMethod } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong while placing your order.';
      if (orderId) {
        // The order itself was already created (and the cart cleared) before this step failed.
        // Don't let the customer resubmit from an empty cart \u2014 send them to resume this exact order instead.
        setCreatedOrderId(orderId);
        setErrorMessage(`${message} Your order #${orderId} was already created.`);
      } else {
        setErrorMessage(message);
      }
      setIsPlacing(false);
    }
  };

  if (createdOrderId) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #fecaca', borderRadius: '14px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Almost there
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage}</p>
        <Link to={`/orders/${createdOrderId}`}>
          <Button variant="primary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
            Resume Order #{createdOrderId} <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Checkout</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Review your order, choose a delivery address and payment method</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left: Address, Payment, Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* Delivery Address */}
          <section style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#0d9488" /> Delivery Address
            </h2>
            <AddressSelector selectedId={selectedAddress?.id ?? null} onSelect={setSelectedAddress} />
          </section>

          {/* Payment Method */}
          <section style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="#0d9488" /> Payment Method
            </h2>
            <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
          </section>

          {/* Order Items */}
          <section style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>
              Order Summary ({items.length} item{items.length === 1 ? '' : 's'})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {items.map((item) => {
                const product = products[item.productId];
                return (
                  <div key={item.itemId} style={{ display: 'flex', gap: '0.875rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.875rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '8px', border: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {product?.imageUrl ? (
                        <img src={product.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Package size={22} color="#d1d5db" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.78125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                        {product?.sellerId ? `Seller #${product.sellerId} · ` : ''}Qty: {item.quantity} × {formatMoney(item.priceAmount, item.priceCurrency)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#111827', flexShrink: 0 }}>{formatMoney(item.priceAmount * item.quantity, item.priceCurrency)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: Sticky Summary + Place Order */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', position: 'sticky', top: '5rem' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>Price Details</h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '0.625rem' }}>
            <span style={{ color: '#6b7280' }}>Cart Subtotal</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(subtotal, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem', marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280' }}>Delivery</span>
            <span style={{ fontWeight: 700, color: '#059669' }}>FREE</span>
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
              Final discount, tax and total are calculated securely on the server when you place your order.
            </p>
          </div>

          {/* Review recap */}
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#374151', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <div><strong>Deliver to:</strong> {selectedAddress ? `${selectedAddress.recipientName}, ${selectedAddress.city}` : 'No address selected'}</div>
            <div><strong>Items:</strong> {items.length} · <strong>Pay via:</strong> {paymentMethod.replace('_', ' ')}</div>
          </div>

          {errorMessage && !createdOrderId && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <strong>!</strong> {errorMessage}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
            onClick={handlePlaceOrder}
            isLoading={isPlacing}
            disabled={isPlacing || !selectedAddress}
          >
            {isPlacing ? 'Placing Order...' : 'Place Order'}
          </Button>

          <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#0d9488' }}>
            <ArrowLeft size={14} /> Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
};
