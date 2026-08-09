import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import { paymentApi } from '../../api/paymentApi';
import { shippingApi } from '../../api/shippingApi';
import type { Order, Payment, PaymentStatus, Shipping, ShippingStatus, OrderStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatMoney, formatDateTime } from '../../utils/format';
import { ArrowLeft } from 'lucide-react';

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const SHIPPING_STATUSES: ShippingStatus[] = ['CREATED', 'READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'SUCCESS', 'FAILED'];

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyField, setBusyField] = useState('');

  const load = useCallback(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    setErrorMessage('');
    orderApi
      .getAdminOrderById(orderId)
      .then((o) => {
        setOrder(o);
        paymentApi.getPayment(orderId).then(setPayment).catch(() => setPayment(null));
        shippingApi.getShipment(orderId).then(setShipping).catch(() => setShipping(null));
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Order not found.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleOrderStatus = async (status: OrderStatus) => {
    setBusyField('order');
    setErrorMessage('');
    try {
      const updated = await orderApi.updateOrderStatusByAdmin(orderId, status);
      setOrder(updated);
      notify('Order status updated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update order status.');
    } finally {
      setBusyField('');
    }
  };

  const handleShippingStatus = async (status: ShippingStatus) => {
    setBusyField('shipping');
    setErrorMessage('');
    try {
      const updated = await shippingApi.updateShippingStatusByAdmin(orderId, status);
      setShipping(updated);
      notify('Shipping status updated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update shipping status.');
    } finally {
      setBusyField('');
    }
  };

  const handlePaymentStatus = async (status: PaymentStatus) => {
    setBusyField('payment');
    setErrorMessage('');
    try {
      const updated = await paymentApi.updatePaymentStatusByAdmin(orderId, status);
      setPayment(updated);
      notify('Payment status updated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update payment status.');
    } finally {
      setBusyField('');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading order...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Order not found</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage || 'The requested order could not be loaded.'}</p>
        <Link to="/admin/orders"><Button variant="secondary">Back to Orders</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Order #{order.id}</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <Link to="/admin/orders" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={14} /> All Orders
        </Link>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
        {/* Items + totals */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Items & Pricing</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>{item.productName}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                    SKU: {item.sku} · Seller #{item.sellerId} · Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(item.lineTotal, item.priceCurrency)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>−{formatMoney(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Tax</span>
              <span style={{ fontWeight: 600 }}>{formatMoney(order.taxAmount, order.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #e5e7eb', paddingTop: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: '#111827' }}>Total</span>
              <span style={{ fontWeight: 900, color: '#0d9488', fontSize: '1.125rem' }}>{formatMoney(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </div>

        {/* Admin controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>Order Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Badge status={order.status} />
              <select
                className="input-field"
                style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                value={order.status}
                disabled={busyField === 'order'}
                onChange={(e) => handleOrderStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>Shipping</h3>
            {shipping ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Badge status={shipping.shippingStatus} />
                  <select
                    className="input-field"
                    style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                    value={shipping.shippingStatus}
                    disabled={busyField === 'shipping'}
                    onChange={(e) => handleShippingStatus(e.target.value as ShippingStatus)}
                  >
                    {SHIPPING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {shipping.trackingNumber && <div style={{ color: '#6b7280' }}>Tracking: <strong style={{ color: '#111827' }}>{shipping.trackingNumber}</strong></div>}
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.875rem', fontSize: '0.8125rem', color: '#374151' }}>
                  <div style={{ fontWeight: 700 }}>{shipping.shippingAddress.recipientName}</div>
                  <div>{shipping.shippingAddress.addressLine1}</div>
                  {shipping.shippingAddress.addressLine2 && <div>{shipping.shippingAddress.addressLine2}</div>}
                  <div>{shipping.shippingAddress.city}, {shipping.shippingAddress.state} {shipping.shippingAddress.postalCode}, {shipping.shippingAddress.country}</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No shipment created for this order yet.</p>
            )}
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>Payment</h3>
            {payment ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Badge status={payment.status} />
                  <select
                    className="input-field"
                    style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                    value={payment.status}
                    disabled={busyField === 'payment'}
                    onChange={(e) => handlePaymentStatus(e.target.value as PaymentStatus)}
                  >
                    {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ color: '#6b7280' }}>
                  Amount: <strong style={{ color: '#111827' }}>{formatMoney(payment.amount, payment.currency)}</strong> · Provider: {payment.provider}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No payment recorded for this order yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
