import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { shippingApi } from '../api/shippingApi';
import type { Order, Payment, Shipping, ShippingAddressDto } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { formatMoney, formatDateTime } from '../utils/format';
import { ArrowLeft, CreditCard, PackageCheck, Truck } from 'lucide-react';

const emptyAddress: ShippingAddressDto = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [address, setAddress] = useState<ShippingAddressDto>(emptyAddress);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  const load = useCallback(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    setErrorMessage('');
    orderApi
      .getOrderById(orderId)
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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setIsCancelling(true);
    setErrorMessage('');
    try {
      const updated = await orderApi.cancelOrder(orderId);
      setOrder(updated);
      setSuccessMessage('Order cancelled successfully.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not cancel the order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingShipment(true);
    setErrorMessage('');
    try {
      const result = await shippingApi.createShipment(orderId, { shippingAddress: address });
      setShipping(result);
      setShowShipmentForm(false);
      setSuccessMessage('Shipment created. Your order is now being processed.');
      const refreshed = await orderApi.getOrderById(orderId);
      setOrder(refreshed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not create the shipment.');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const updateAddress = (field: keyof ShippingAddressDto, value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading order...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Order not found</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage || 'The requested order could not be loaded.'}</p>
        <Link to="/orders"><Button variant="secondary">Back to Orders</Button></Link>
      </div>
    );
  }

  const cancellable = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PROCESSING';
  const canCreateShipment = (order.status === 'CONFIRMED' || order.status === 'PROCESSING') && !shipping;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Order #{order.id}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge status={order.status} />
          <Link to="/orders" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
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
        {/* Items */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Order Items</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.875rem' }}>
                <div>
                  <Link to={`/products/${item.productId}`} style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', textDecoration: 'none' }}>
                    {item.productName}
                  </Link>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>
                    SKU: {item.sku} · Qty: {item.quantity} × {formatMoney(item.unitPriceAmount, item.priceCurrency)}
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

        {/* Right column: payment + shipping + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Payment */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} /> Payment
            </h2>
            {payment ? (
              <div style={{ fontSize: '0.9375rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <Badge status={payment.status} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Amount</span>
                  <span style={{ fontWeight: 700 }}>{formatMoney(payment.amount, payment.currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Provider</span>
                  <span style={{ fontWeight: 600 }}>{payment.provider}</span>
                </div>
                {payment.transactionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Transaction</span>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{payment.transactionId}</span>
                  </div>
                )}
              </div>
            ) : order.status === 'PENDING' ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Payment has not been completed yet.</p>
                <Link to={`/checkout/payment/${order.id}`}>
                  <Button variant="primary">Pay Now</Button>
                </Link>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No payment record found.</p>
            )}
          </div>

          {/* Shipping */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} /> Shipping
            </h2>
            {shipping ? (
              <div style={{ fontSize: '0.9375rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Status</span>
                  <Badge status={shipping.shippingStatus} />
                </div>
                {shipping.trackingNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Tracking</span>
                    <span style={{ fontWeight: 700 }}>{shipping.trackingNumber}</span>
                  </div>
                )}
                {shipping.carrier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Carrier</span>
                    <span style={{ fontWeight: 600 }}>{shipping.carrier}</span>
                  </div>
                )}
                <div style={{ marginTop: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.875rem', fontSize: '0.8125rem', color: '#374151' }}>
                  <div style={{ fontWeight: 700 }}>{shipping.shippingAddress.recipientName}</div>
                  <div>{shipping.shippingAddress.addressLine1}</div>
                  {shipping.shippingAddress.addressLine2 && <div>{shipping.shippingAddress.addressLine2}</div>}
                  <div>
                    {shipping.shippingAddress.city}, {shipping.shippingAddress.state} {shipping.shippingAddress.postalCode}
                  </div>
                  <div>{shipping.shippingAddress.country}</div>
                </div>
              </div>
            ) : canCreateShipment && !showShipmentForm ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Add your shipping address to start the delivery process.</p>
                <Button variant="primary" onClick={() => setShowShipmentForm(true)}>Create Shipment</Button>
              </div>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No shipment created yet.</p>
            )}

            {showShipmentForm && (
              <form onSubmit={handleCreateShipment} style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Recipient name" value={address.recipientName} onChange={(e) => updateAddress('recipientName', e.target.value)} required />
                <Input label="Phone" value={address.phone} onChange={(e) => updateAddress('phone', e.target.value)} required />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Address line 1" value={address.addressLine1} onChange={(e) => updateAddress('addressLine1', e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Address line 2 (optional)" value={address.addressLine2 ?? ''} onChange={(e) => updateAddress('addressLine2', e.target.value)} />
                </div>
                <Input label="City" value={address.city} onChange={(e) => updateAddress('city', e.target.value)} required />
                <Input label="State" value={address.state} onChange={(e) => updateAddress('state', e.target.value)} required />
                <Input label="Postal code" value={address.postalCode} onChange={(e) => updateAddress('postalCode', e.target.value)} required />
                <Input label="Country" value={address.country} onChange={(e) => updateAddress('country', e.target.value)} required />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                  <Button type="submit" variant="primary" isLoading={isCreatingShipment}>
                    {isCreatingShipment ? 'Creating...' : 'Submit Address'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowShipmentForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </div>

          {/* Actions */}
          {cancellable && (
            <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem' }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackageCheck size={18} /> Actions
              </h2>
              <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
