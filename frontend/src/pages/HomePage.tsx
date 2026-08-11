import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/ui/ProductCard';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import type { Category, Product } from '../types';
import { formatMoney } from '../utils/format';
import {
  Zap, Truck, ShieldCheck, RotateCcw,
  Headphones, Shirt, Home, Sparkles, BookOpen, Dumbbell, Tag,
  ArrowRight, Package, Layers, Store, Star, Flame, CheckCircle2, Lock
} from 'lucide-react';

const categoryVisuals = [
  { icon: Headphones, color: '#f0fdfa', iconColor: '#0d9488', desc: 'Gadgets & Tech' },
  { icon: Shirt, color: '#fdf4ff', iconColor: '#9333ea', desc: 'Apparel & Trends' },
  { icon: Home, color: '#eff6ff', iconColor: '#2563eb', desc: 'Kitchen & Decor' },
  { icon: Sparkles, color: '#fff7ed', iconColor: '#f97316', desc: 'Skincare & Makeup' },
  { icon: BookOpen, color: '#f0fdf4', iconColor: '#16a34a', desc: 'Best Seller Books' },
  { icon: Dumbbell, color: '#fefce8', iconColor: '#ca8a04', desc: 'Gym & Outdoor' },
  { icon: Tag, color: '#eff6ff', iconColor: '#2563eb', desc: 'Special Bargains' },
  { icon: Package, color: '#fdf4ff', iconColor: '#9333ea', desc: 'Daily Essentials' },
];

const trustItems = [
  { icon: ShieldCheck, label: '100% Genuine Products', desc: 'Every item verified by our merchant quality team before listing.', color: '#0d9488' },
  { icon: Truck, label: 'Fast & Free Delivery', desc: 'Free express shipping on all eligible marketplace orders over ₹999.', color: '#2563eb' },
  { icon: RotateCcw, label: 'Easy 30-Day Returns', desc: 'Changed your mind? Hassle-free return pickups with instant refunds.', color: '#9333ea' },
  { icon: Lock, label: '256-Bit Secure Payments', desc: 'End-to-end encrypted checkout. Your financial data is always safe.', color: '#16a34a' },
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

  // Top rated products
  const topRatedProducts = [...products]
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 4);

  // Today's deals products
  const dealsProducts = [...products]
    .slice(0, 4);

  const heroProduct = products[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ══ HERO SECTION ════════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 65%, #115e59 100%)',
          padding: 'clamp(2.5rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 2.5rem)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Soft Ambient Background Glows */}
        <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(45,212,191,0.18) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '15%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(2rem, 5vw, 3.5rem)', alignItems: 'center', position: 'relative' }}>
          
          {/* Left Column: Hero Text & CTAs */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', color: '#fdba74', padding: '0.35rem 0.875rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              <Zap size={14} fill="#f97316" color="#f97316" /> Multi-Vendor Marketplace
            </div>

            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.12, letterSpacing: '-0.025em', marginBottom: '1rem' }}>
              Discover Products<br />
              <span style={{ color: '#2dd4bf' }}>You'll Love.</span>
            </h1>

            <p style={{ fontSize: 'clamp(0.9375rem, 2vw, 1.0625rem)', color: '#ccfbf1', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '520px' }}>
              Shop from verified independent sellers. Genuine products, great prices, fast delivery and easy returns.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/products" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: '#f97316',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 6px 20px rgba(249, 115, 22, 0.35)',
                    transition: 'transform 180ms ease, background 180ms ease'
                  }}
                  className="btn-press"
                  onMouseEnter={e => (e.currentTarget.style.background = '#ea580c')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f97316')}
                >
                  Shop All Products <ArrowRight size={18} />
                </button>
              </Link>

              <a href="#categories" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1.5px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 180ms ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                >
                  Explore Categories
                </button>
              </a>
            </div>

            {/* Micro Feature Badges */}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f0fdfa', fontSize: '0.8125rem', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#2dd4bf" /> Verified Independent Sellers
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f0fdfa', fontSize: '0.8125rem', fontWeight: 600 }}>
                <Truck size={16} color="#2dd4bf" /> 2-Day Express Delivery
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f0fdfa', fontSize: '0.8125rem', fontWeight: 600 }}>
                <RotateCcw size={16} color="#2dd4bf" /> 30-Day Money Back Guarantee
              </div>
            </div>
          </div>

          {/* Right Column: E-Commerce Product Visual Card */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '1.25rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                position: 'relative'
              }}
            >
              {/* Badge Overlays */}
              <div style={{ position: 'absolute', top: '-14px', right: '16px', background: '#0d9488', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: '999px', boxShadow: '0 4px 10px rgba(13,148,136,0.3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 size={13} /> Verified Seller Product
              </div>

              {/* Product Preview Image */}
              <div style={{ width: '100%', height: '200px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
                {heroProduct?.imageUrl ? (
                  <img src={heroProduct.imageUrl} alt={heroProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
                ) : (
                  <Package size={64} color="#0d9488" strokeWidth={1.5} />
                )}
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: '#dc2626', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                  20% OFF TODAY
                </div>
              </div>

              {/* Product Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Featured Marketplace Deal
                </span>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {heroProduct?.name || 'Premium ShopSphere Product'}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827' }}>
                      {formatMoney(heroProduct?.price || 999, heroProduct?.priceCurrency || 'INR')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                      {formatMoney((heroProduct?.price || 999) * 1.25, heroProduct?.priceCurrency || 'INR')}
                    </div>
                  </div>

                  <Link to={heroProduct ? `/products/${heroProduct.id}` : '/products'}>
                    <Button variant="primary" size="sm" style={{ fontWeight: 800 }}>
                      View Product
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Floating Delivery Tag */}
              <div style={{ position: 'absolute', bottom: '-16px', left: '16px', background: '#111827', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Truck size={13} color="#2dd4bf" /> Free Express Delivery Included
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══ SHOP BY CATEGORY SECTION ════════════════════════════════ */}
      <section id="categories" style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2.5rem)', background: '#ffffff' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
                Shop by Category
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Explore products across every major department
              </p>
            </div>
            <Link to="/products" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
              View All Categories <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
              gap: '1rem'
            }}
          >
            {categories.map((cat, index) => {
              const visual = categoryVisuals[index % categoryVisuals.length];
              const Icon = visual.icon;
              return (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  style={{
                    padding: '1.25rem 0.75rem',
                    textAlign: 'center',
                    background: '#ffffff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.625rem',
                    textDecoration: 'none',
                    transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#0d9488';
                    el.style.transform = 'translateY(-4px)';
                    el.style.boxShadow = '0 8px 20px rgba(13,148,136,0.12)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#e5e7eb';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{ width: 50, height: 50, borderRadius: '12px', background: visual.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={visual.iconColor} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 600, marginTop: '0.1rem' }}>Explore →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ TOP RATED PRODUCTS SECTION ══════════════════════════════ */}
      {topRatedProducts.length > 0 && (
        <section style={{ padding: '0 clamp(1.25rem, 4vw, 2.5rem) clamp(2.5rem, 4vw, 4rem)', background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: 'clamp(2.5rem, 4vw, 3.5rem)', paddingBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
                  Top Rated Products
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Highest customer rating items from verified sellers
                </p>
              </div>
              <Link to="/products" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                Explore All Products <ArrowRight size={15} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
              {topRatedProducts.map(p => (
                <ProductCard key={p.id} product={p} categoryName={categoryNameOf(p.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ 🔥 TODAY'S DEALS SECTION ════════════════════════════════ */}
      {dealsProducts.length > 0 && (
        <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2.5rem)', background: '#ffffff' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fff7ed', border: '1px solid #fed7aa', color: '#f97316', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '999px', marginBottom: '0.5rem' }}>
                  <Flame size={13} fill="#f97316" color="#f97316" /> Limited Time Deals
                </div>
                <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.01em' }}>
                  Today's Special Deals
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Exclusive seller discounts and promo offers available today
                </p>
              </div>

              <Link to="/products" style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                View All Deals →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
              {dealsProducts.map(p => (
                <ProductCard key={p.id} product={p} categoryName={categoryNameOf(p.categoryId)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ SELL ON SHOPSPHERE SECTION ═════════════════════════════ */}
      <section style={{ padding: '0 clamp(1.25rem, 4vw, 2.5rem) clamp(2.5rem, 4vw, 4rem)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
              borderRadius: '20px',
              padding: 'clamp(2rem, 5vw, 3.5rem)',
              color: '#ffffff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: '2rem',
              alignItems: 'center',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Seller Portal
              </div>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#ffffff', marginBottom: '1rem', lineHeight: 1.2 }}>
                Sell on ShopSphere
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#9ca3af', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Reach millions of active buyers across India. Manage catalogs, orders, and payments with our seller dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#e5e7eb', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#0d9488" /> Easy product & catalog management
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#e5e7eb', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#0d9488" /> Real-time order management & analytics
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#e5e7eb', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#0d9488" /> Fast seller payouts & dedicated support
                </div>
              </div>

              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button
                  style={{
                    background: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(13,148,136,0.3)'
                  }}
                  className="btn-press"
                >
                  Become a Seller <ArrowRight size={18} />
                </button>
              </Link>
            </div>

            {/* Seller Illustration Card */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '320px', background: '#1f2937', border: '1px solid #374151', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
                <Store size={48} color="#2dd4bf" style={{ margin: '0 auto 1rem' }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem' }}>
                  Merchant Dashboard
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0 }}>
                  Join thousands of successful sellers growing on ShopSphere.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ WHY CHOOSE SHOPSPHERE SECTION ══════════════════════════ */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1.25rem, 4vw, 2.5rem)', background: '#ffffff', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Why Choose ShopSphere
            </h2>
            <p style={{ fontSize: '0.9375rem', color: '#6b7280', marginTop: '0.35rem' }}>
              Built for security, speed, and customer satisfaction
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
            {trustItems.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.875rem',
                    transition: 'all 200ms ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#0d9488';
                    el.style.transform = 'translateY(-3px)';
                    el.style.boxShadow = '0 8px 20px rgba(13,148,136,0.08)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.borderColor = '#e5e7eb';
                    el.style.transform = 'translateY(0)';
                    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                  }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={item.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', marginBottom: '0.35rem' }}>{item.label}</h4>
                    <p style={{ fontSize: '0.8375rem', color: '#6b7280', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
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
