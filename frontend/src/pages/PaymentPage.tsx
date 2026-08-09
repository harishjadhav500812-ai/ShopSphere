import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import type { Order, Payment } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatMoney } from '../utils/format';
import { CheckCircle, CreditCard, XCircle } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id || isNaN(id)) return;
    setIsLoading(true);
    orderApi
      .getOrderById(id)
      .then((o) => {
        setOrder(o);
        return paymentApi.getPayment(id).then(setPayment).catch(() => setPayment(null));
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Order not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handlePay = async () => {
    setIsPaying(true);
    setErrorMessage('');
    try {
      const result = await paymentApi.processPayment(id);
      setPayment(result);
      const refreshed = await orderApi.getOrderById(id);
      setOrder(refreshed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading payment...</div>;
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center' }}>
        <XCircle size={48} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>Unable to load order</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage || 'The requested order could not be found.'}</p>
        <Link to="/orders"><Button variant="secondary">Back to Orders</Button></Link>
      </div>
    );
  }

  const paid = payment?.status === 'SUCCESS';

  return (
    <div style={{ maxWidth: '560px', margin: '2rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        {paid ? (
          <CheckCircle size={56} color="#059669" style={{ marginBottom: '0.75rem' }} />
        ) : (
          <CreditCard size={56} color="#0d9488" style={{ marginBottom: '0.75rem' }} />
        )}
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
          {paid ? 'Payment Successful' : 'Complete Your Payment'}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.375rem' }}>Order #{order.id}</p>
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #e5e7eb', paddingTop: '0.625rem' }}>
          <span style={{ fontWeight: 800, color: '#111827' }}>Total Payable</span>
          <span style={{ fontWeight: 900, color: '#0d9488', fontSize: '1.25rem' }}>{formatMoney(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {paid && payment ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
            Payment <Badge status={payment.status} /> via {payment.provider}
            {payment.transactionId ? ` · Txn ${payment.transactionId}` : ''}
          </div>
          <Link to={`/orders/${order.id}`}>
            <Button variant="primary" size="lg">View Order Details</Button>
          </Link>
        </div>
      ) : (
        <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={handlePay} isLoading={isPaying}>
          {isPaying ? 'Processing Payment...' : `Pay ${formatMoney(order.totalAmount, order.currency)}`}
        </Button>
      )}
    </div>
  );
};
