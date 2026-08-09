import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Category, Product } from '../types';
import {
  Zap, Truck, ShieldCheck, RotateCcw,
  Headphones, Shirt, Home, Sparkles, BookOpen, Dumbbell, Tag,
  ArrowRight, Package, Layers, Store, Star,
} from 'lucide-react';

const categoryVisuals = [
  { icon: Headphones, color: '#eff6ff', iconColor: '#2563eb' },
  { icon: Shirt, color: '#fdf4ff', iconColor: '#9333ea' },
  { icon: Home, color: '#f0fdfa', iconColor: '#0d9488' },
  { icon: Sparkles, color: '#fff7ed', iconColor: '#f97316' },
  { icon: BookOpen, color: '#f0fdf4', iconColor: '#16a34a' },
  { icon: Dumbbell, color: '#fefce8', iconColor: '#ca8a04' },
  { icon: Tag, color: '#eff6ff', iconColor: '#2563eb' },
  { icon: Package, color: '#fdf4ff', iconColor: '#9333ea' },
];

const trustItems = [
  { icon: ShieldCheck, label: '100% Genuine Products', desc: 'Every product verified by our merchant quality team before listing.', color: '#0d9488' },
  { icon: Truck, label: 'Free & Fast Delivery', desc: 'Fast shipping on your orders. Delivered within 2–5 days.', color: '#2563eb' },
  { icon: RotateCcw, label: 'Easy 30-Day Returns', desc: 'Changed your mind? Hassle-free returns with quick refunds.', color: '#9333ea' },
  { icon: ShieldCheck, label: 'Secure Payments', desc: 'End-to-end encrypted checkout. Your payment details are always safe.', color: '#16a34a' },
];

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    productApi
      .getProducts({ activeOnly: true })
      .then(setProducts)
      .catch(() => setProducts([]));
    categoryApi
      .getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const categoryNameOf = (categoryId?: number) => categories.find((c) => c.id === categoryId)?.name;

  const trendingProducts = [...products]
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 4);

  const featuredProducts = [...products]
    .sort((a, b) => b.id - a.id)
    .filter((p) => !trendingProducts.some((t) => t.id === p.id))
    .slice(0, 4);

  const stats = [
    { icon: Package, value: String(products.length), label: 'Products Listed' },
    { icon: Layers, value: String(categories.length), label: 'Categories' },
    { icon: Store, value: String(new Set(products.map((p) => p.sellerId)).size), label: 'Active Sellers' },
    { icon: Star, value: '4.8★', label: 'Trusted Marketplace' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 55%, #115e59 100%)',
        padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 4vw, 3rem)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', background: 'rgba(13,148,136,0.12)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '280px', height: '280px', background: 'rgba(249,115,22,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(2rem, 5vw, 4rem)', alignItems: 'center', position: 'relative' }}>

          {/* Hero Copy */}
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#fdba74', padding: '0.35rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <Zap size={14} fill="currentColor" /> Multi-Vendor Marketplace
            </div>

            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Discover Products<br />
              <span style={{ color: '#2dd4bf' }}>You'll Love,</span><br />
              <span style={{ color: '#f97316' }}>From Sellers You Can Trust.</span>
            </h1>

            <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.0625rem)', color: '#99f6e4', lineHeight: 1.65, marginBottom: '2rem', maxWidth: '500px' }}>
              Shop from verified independent merchants. Genuine products, fast delivery, easy returns.
            </p>

            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
              <Link to="/products">
                <Button variant="deal" size="lg" rightIcon={<ArrowRight size={18} />}>
                  Shop All Products
                </Button>
              </Link>
              <Link to="/register">
                <button style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9375rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 200ms', fontFamily: 'inherit' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  className="btn-press"
                >
                  Sell on ShopSphere
                </button>
              </Link>
            </div>

            {/* Stat Strip */}
            <div style={{ display: 'flex', gap: 'clamp(1.5rem, 4vw, 3rem)', marginTop: '2.5rem', flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <s.icon size={18} color="#2dd4bf" strokeWidth={1.8} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.125rem', color: '#fff', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7dd3fc', marginTop: '0.1rem' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual — Product Composition */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ width: 'clamp(260px, 40vw, 340px)', height: 'clamp(260px, 40vw, 340px)', background: 'linear-gradient(135deg, rgba(45,212,191,0.15), rgba(249,115,22,0.1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(13,148,136,0.25), inset 0 0 40px rgba(13,148,136,0.08)', border: '1px solid rgba(45,212,191,0.2)' }}>
              <div style={{ textAlign: 'center', color: '#2dd4bf' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="58" stroke="rgba(45,212,191,0.3)" strokeWidth="2" />
                  <path d="M30 45 L45 30 L90 30 L90 75 L75 90 L30 90 Z" stroke="#2dd4bf" strokeWidth="2" fill="rgba(13,148,136,0.2)" />
                  <path d="M30 45 L75 45 L75 90" stroke="#2dd4bf" strokeWidth="2" fill="none" />
                  <path d="M45 30 L45 75" stroke="#2dd4bf" strokeWidth="2" fill="none" />
                  <circle cx="60" cy="60" r="6" fill="#f97316" />
                  <circle cx="48" cy="48" r="3" fill="rgba(45,212,191,0.6)" />
                  <circle cx="72" cy="72" r="3" fill="rgba(45,212,191,0.6)" />
                </svg>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#fff', marginTop: '0.75rem', letterSpacing: '-0.02em' }}>
                  Shop<span style={{ color: '#2dd4bf' }}>Sphere</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#99f6e4', marginTop: '0.25rem' }}>Premium Marketplace</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ═════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section style={{ padding: 'clamp(2rem, 4vw, 3.5rem) clamp(1rem, 4vw, 2rem)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Shop by Category</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Explore products across every department</p>
              </div>
              <Link to="/products" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap', transition: 'gap 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.gap = '0.6rem')}
                onMouseLeave={e => (e.currentTarget.style.gap = '0.3rem')}>
                View All <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))', gap: '1rem' }}>
              {categories.map((cat, index) => {
                const visual = categoryVisuals[index % categoryVisuals.length];
                const Icon = visual.icon;
                return (
                  <Link
                    key={cat.id}
                    to={`/products?categoryId=${cat.id}`}
                    style={{
                      padding: '1.25rem 0.75rem', textAlign: 'center',
                      background: '#fff', border: '1.5px solid #e5e7eb',
                      borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                      transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = visual.iconColor; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#e5e7eb'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
                  >
                    <div style={{ width: 52, height: 52, borderRadius: '12px', background: visual.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={26} color={visual.iconColor} strokeWidth={1.8} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ TRENDING NOW ═══════════════════════════════════════════ */}
      {trendingProducts.length > 0 && (
        <section style={{ padding: '0 clamp(1rem, 4vw, 2rem) clamp(2rem, 4vw, 3rem)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
                  Top Rated Products
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Highest-rated products from our marketplace</p>
              </div>
              <Link to="/products" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                onMouseEnter={e => (e.currentTarget.style.gap = '0.6rem')}
                onMouseLeave={e => (e.currentTarget.style.gap = '0.3rem')}>
                Explore All <ArrowRight size={15} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
              {trendingProducts.map(p => (
                <ProductCard key={p.id} product={p} categoryName={categoryNameOf(p.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ NEW ARRIVALS ═════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section style={{ padding: '0 clamp(1rem, 4vw, 2rem) clamp(2rem, 4vw, 3rem)', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: 'clamp(2rem, 4vw, 3rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>New Arrivals</h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>The latest additions from verified merchant stores</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
              {featuredProducts.map(p => (
                <ProductCard key={p.id} product={p} categoryName={categoryNameOf(p.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ TRUST SECTION ══════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Why Choose ShopSphere</h2>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', marginTop: '0.5rem' }}>We've built the platform around what matters most to customers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
            {trustItems.map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', display: 'flex', flexDirection: 'column', gap: '0.875rem', transition: 'box-shadow 200ms, transform 200ms' }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.07)'; el.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={item.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: '0.375rem' }}>{item.label}</h4>
                    <p style={{ fontSize: '0.8375rem', color: '#6b7280', lineHeight: 1.55 }}>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};
