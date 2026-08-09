import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../api/orderApi';
import type { Order, OrderStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { OrderStatusTimeline } from '../../components/order/OrderStatusTimeline';
import { formatMoney, formatDateTime } from '../../utils/format';
import { ArrowLeft, Truck } from 'lucide-react';

/**
 * Statuses a seller is permitted to advance an order to. Enforced server-side
 * regardless of this list \u2014 this only drives which actions are offered in the UI.
 */
const SELLER_NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
};

export const SellerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const load = useCallback(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    orderApi
      .getSellerOrderById(orderId)
      .then(setOrder)
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Order not found.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdvanceStatus = async (nextStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    setErrorMessage('');
    try {
      const updated = await orderApi.updateOrderStatusBySeller(orderId, nextStatus);
      setOrder(updated);
      setSuccessMessage(`Order status updated to ${nextStatus}.`);
      window.setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update the order status.');
    } finally {
      setIsUpdatingStatus(false);
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
        <Link to="/seller/orders"><Button variant="secondary">Back to Seller Orders</Button></Link>
      </div>
    );
  }

  const myItems = user ? order.items.filter((i) => i.sellerId === user.id) : order.items;
  const otherItems = user ? order.items.filter((i) => i.sellerId !== user.id) : [];
  const nextStatus = SELLER_NEXT_STATUS[order.status];

  const renderItem = (item: Order['items'][number], highlight: boolean) => (
    <div
      key={item.id}
      style={{
        display: 'flex', justifyContent: 'space-between', gap: '1rem',
        borderBottom: '1px solid #f3f4f6', paddingBottom: '0.875rem',
        background: highlight ? '#f0fdfa' : 'transparent',
        borderRadius: highlight ? '8px' : 0,
        padding: highlight ? '0.625rem 0.75rem' : undefined,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
          {item.productName}
          {highlight && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.625rem', fontWeight: 800, color: '#0d9488', background: '#ccfbf1', borderRadius: '999px', padding: '0.125rem 0.5rem' }}>YOURS</span>
          )}
        </div>
        <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
          SKU: {item.sku} · Qty: {item.quantity} × {formatMoney(item.unitPriceAmount, item.priceCurrency)}
        </div>
      </div>
      <div style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(item.lineTotal, item.priceCurrency)}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Order #{order.id}</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge status={order.status} />
          <Link to="/seller/orders" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={14} /> All Orders
          </Link>
        </div>
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
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Order Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {myItems.map((item) => renderItem(item, true))}
            {otherItems.map((item) => renderItem(item, false))}
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem', maxWidth: '320px', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discount</span>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Tracking */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1.125rem' }}>Fulfillment Status</h2>
            <OrderStatusTimeline orderStatus={order.status} />
          </div>

          {/* Seller status action */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={17} /> Update Fulfillment
            </h2>
            {nextStatus ? (
              <div>
                <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.875rem' }}>
                  Mark this order as <strong style={{ color: '#111827' }}>{nextStatus}</strong> once you've completed this step.
                </p>
                <Button variant="primary" onClick={() => handleAdvanceStatus(nextStatus)} isLoading={isUpdatingStatus} style={{ width: '100%' }}>
                  {isUpdatingStatus ? 'Updating...' : `Mark as ${nextStatus}`}
                </Button>
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                {order.status === 'DELIVERED' || order.status === 'SHIPPED'
                  ? 'Remaining delivery updates are handled automatically as the shipment progresses.'
                  : order.status === 'CANCELLED'
                  ? 'This order was cancelled and requires no further action.'
                  : 'No further seller action is available for this order right now.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
