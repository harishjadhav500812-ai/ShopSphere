import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import type { Order, Page } from '../types';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/catalog/Pagination';
import { formatMoney, formatDateTime } from '../utils/format';
import { PackageSearch } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [page, setPage] = useState<Page<Order> | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback((pageIndex: number) => {
    setIsLoading(true);
    setErrorMessage('');
    orderApi
      .getCustomerOrders({ page: pageIndex, size: 8 })
      .then((res) => {
        setPage(res);
        setCurrentPage(res.number);
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load your orders.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>My Orders</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Track and manage your purchases</p>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading orders...</div>
      ) : !page || page.content.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <PackageSearch size={54} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>No orders yet</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>When you place orders, they will show up here.</p>
          <Link to="/products" style={{ color: '#0d9488', fontWeight: 700 }}>Start Shopping →</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {page.content.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', transition: 'border-color 150ms, box-shadow 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>Order #{order.id}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {formatDateTime(order.createdAt)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Badge status={order.status} />
                  <span style={{ fontWeight: 800, color: '#0d9488', fontSize: '1.0625rem' }}>{formatMoney(order.totalAmount, order.currency)}</span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={page.totalPages || 1} onPageChange={(p) => load(p)} />
        </>
      )}
    </div>
  );
};
