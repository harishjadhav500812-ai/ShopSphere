import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { shippingApi } from '../api/shippingApi';
import { useProductLookup } from '../hooks/useProductLookup';
import type { Order, Shipping, PaymentMethod } from '../types';
import { Button } from '../components/ui/Button';
import { formatMoney, formatDateTime } from '../utils/format';
import { CheckCircle2, Package, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const location = useLocation();
  const paymentMethod = (location.state as { paymentMethod?: PaymentMethod } | null)?.paymentMethod;
  const { products } = useProductLookup();

  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    orderApi
      .getOrderById(orderId)
      .then((o) => {
        setOrder(o);
        shippingApi.getShipment(orderId).then(setShipping).catch(() => setShipping(null));
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load this order.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Confirming your order...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>We couldn't confirm this order</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage || 'The order could not be found.'}</p>
        <Link to="/orders"><Button variant="secondary">Go to My Orders</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Success banner */}
      <div style={{ textAlign: 'center', padding: '2rem 1rem 0.5rem' }}>
        <div style={{ display: 'inline-flex', width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <CheckCircle2 size={40} color="#059669" />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827' }}>
          Order Placed Successfully!
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginTop: '0.375rem' }}>
          Order <strong style={{ color: '#111827' }}>#{order.id}</strong> was placed on {formatDateTime(order.createdAt)}
        </p>
      </div>

      {/* Summary card */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Total Paid</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d9488' }}>{formatMoney(order.totalAmount, order.currency)}</div>
          </div>
          {paymentMethod && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>Payment Method</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end' }}>
                <ShoppingBag size={15} /> {paymentMethod.replace('_', ' ')}
              </div>
            </div>
          )}
        </div>

        {/* Delivery address */}
        {shipping && (
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#0d9488" /> Delivering To
            </h2>
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.875rem', fontSize: '0.8125rem', color: '#374151' }}>
              <div style={{ fontWeight: 700 }}>{shipping.shippingAddress.recipientName}</div>
              <div>{shipping.shippingAddress.addressLine1}{shipping.shippingAddress.addressLine2 ? `, ${shipping.shippingAddress.addressLine2}` : ''}</div>
              <div>{shipping.shippingAddress.city}, {shipping.shippingAddress.state} {shipping.shippingAddress.postalCode}, {shipping.shippingAddress.country}</div>
              <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>Phone: {shipping.shippingAddress.phone}</div>
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} color="#0d9488" /> Items in this Order
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.items.map((item) => {
              const product = products[item.productId];
              return (
                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '7px', border: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {product?.imageUrl ? (
                      <img src={product.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Package size={18} color="#d1d5db" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{item.productName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Qty: {item.quantity} × {formatMoney(item.unitPriceAmount, item.priceCurrency)}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{formatMoney(item.lineTotal, item.priceCurrency)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#0f766e' }}>
          We'll notify you as your order is confirmed, shipped and delivered. Track its progress anytime from My Orders.
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to={`/orders/${order.id}`} style={{ flex: 1 }}>
            <Button variant="primary" size="lg" style={{ width: '100%', display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
              View Order <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/products" style={{ flex: 1 }}>
            <Button variant="secondary" size="lg" style={{ width: '100%' }}>
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
