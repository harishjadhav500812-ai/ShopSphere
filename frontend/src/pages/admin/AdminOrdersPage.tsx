import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../api/orderApi';
import type { Order, OrderStatus, Page } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/catalog/Pagination';
import { formatMoney, formatDateTime } from '../../utils/format';
import { PackageSearch } from 'lucide-react';

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const AdminOrdersPage: React.FC = () => {
  const [page, setPage] = useState<Page<Order> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);

  const load = useCallback((pageIndex: number) => {
    setIsLoading(true);
    setErrorMessage('');
    orderApi
      .getAdminOrders({ page: pageIndex, size: 8 })
      .then((res) => setPage(res))
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load orders.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    setBusyOrderId(orderId);
    setErrorMessage('');
    try {
      const updated = await orderApi.updateOrderStatusByAdmin(orderId, status);
      setPage((prev) => (prev ? { ...prev, content: prev.content.map((o) => (o.id === updated.id ? updated : o)) } : prev));
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update the order status.');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>All Orders</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Platform-wide order management</p>
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
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <>
          <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '760px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Order</th>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Items</th>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Total</th>
                  <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {page.content.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <Link to={`/admin/orders/${order.id}`} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>#{order.id}</Link>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatDateTime(order.createdAt)}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{order.items.length}</td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#111827' }}>{formatMoney(order.totalAmount, order.currency)}</td>
                    <td style={{ padding: '0.875rem 1rem' }}><Badge status={order.status} /></td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <select
                          className="input-field"
                          style={{ width: 'auto', padding: '0.375rem 0.5rem', fontSize: '0.75rem' }}
                          value={order.status}
                          disabled={busyOrderId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Link to={`/admin/orders/${order.id}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0d9488', whiteSpace: 'nowrap' }}>
                          Details →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page.number} totalPages={page.totalPages || 1} onPageChange={(p) => load(p)} />
        </>
      )}
    </div>
  );
};
