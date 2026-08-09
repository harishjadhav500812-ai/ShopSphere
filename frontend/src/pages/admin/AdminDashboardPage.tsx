import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { categoryApi } from '../../api/categoryApi';
import { couponApi } from '../../api/couponApi';
import { Layers, Package, ShoppingCart, Ticket } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<{ products: number; orders: number; categories: number; coupons: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    Promise.all([
      productApi.getProducts().then((all) => all.length).catch(() => 0),
      orderApi.getAdminOrders({ page: 0, size: 1 }).then((p) => p.totalElements).catch(() => 0),
      categoryApi.getAllCategories().then((all) => all.length).catch(() => 0),
      couponApi.getAdminCoupons().then((all) => all.length).catch(() => 0),
    ])
      .then(([products, orders, categories, coupons]) => setStats({ products, orders, categories, coupons }))
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load dashboard data.'));
  }, []);

  const cards = [
    { label: 'Products', value: stats?.products, icon: <Package size={20} />, to: '/products', desc: 'All products across every seller' },
    { label: 'Orders', value: stats?.orders, icon: <ShoppingCart size={20} />, to: '/admin/orders', desc: 'Manage statuses, shipping & payments' },
    { label: 'Categories', value: stats?.categories, icon: <Layers size={20} />, to: '/admin/categories', desc: 'Organize the product catalog' },
    { label: 'Coupons', value: stats?.coupons, icon: <Ticket size={20} />, to: '/admin/coupons', desc: 'Create and manage discount codes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Admin Dashboard</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Platform administration and oversight</p>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            style={{ textDecoration: 'none', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'border-color 150ms' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0d9488' }}>
              {card.icon}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>{card.value === undefined ? '—' : card.value}</div>
            <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{card.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};
