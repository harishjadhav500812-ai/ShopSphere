import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import type { Order, Product } from '../../types';
import { formatMoney } from '../../utils/format';
import { Boxes, Package, PlusCircle, TrendingUp } from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      productApi.getProducts().then((all) => all.filter((p) => p.sellerId === user.id)),
      orderApi.getSellerOrders({ page: 0, size: 100 }).then((p) => p.content).catch(() => [] as Order[]),
    ])
      .then(([myProducts, sellerOrders]) => {
        setProducts(myProducts);
        setOrders(sellerOrders);
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load dashboard data.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  const activeProducts = products.filter((p) => p.active).length;
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const revenueByCurrency: Record<string, number> = {};
  orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'PENDING')
    .forEach((o) => {
      revenueByCurrency[o.currency] = (revenueByCurrency[o.currency] ?? 0) + o.totalAmount;
    });
  const revenueEntries = Object.entries(revenueByCurrency);

  const stats = [
    { label: 'Total Products', value: String(products.length), sub: `${activeProducts} active`, icon: <Package size={20} />, color: '#0d9488' },
    { label: 'Units in Stock', value: String(totalStock), sub: `${lowStockCount} low-stock item${lowStockCount === 1 ? '' : 's'}`, icon: <Boxes size={20} />, color: '#6366f1' },
    { label: 'Seller Orders', value: String(orders.length), sub: 'across all customers', icon: <TrendingUp size={20} />, color: '#f97316' },
    {
      label: 'Revenue',
      value: revenueEntries.length > 0 ? revenueEntries.map(([c, v]) => formatMoney(v, c)).join(' + ') : '—',
      sub: 'paid & processing orders',
      icon: <TrendingUp size={20} />,
      color: '#059669',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Seller Dashboard</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Welcome back, {user?.fullName}</p>
        </div>
        <Link to="/seller/products/new" style={{ textDecoration: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0d9488', color: '#fff', fontWeight: 700, fontSize: '0.875rem', padding: '0.6rem 1.125rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(13,148,136,0.25)' }}>
            <PlusCircle size={16} /> New Product
          </span>
        </Link>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading dashboard...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: stat.color, marginBottom: '0.75rem' }}>
                  {stat.icon}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#111827' }}>{stat.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>{stat.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <Link to="/seller/products" style={{ textDecoration: 'none', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>Manage Products</span>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Create, edit, deactivate and restock your catalog.</span>
            </Link>
            <Link to="/seller/orders" style={{ textDecoration: 'none', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>Seller Orders</span>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>View customer orders that include your products.</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
