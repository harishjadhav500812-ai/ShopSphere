import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Lock, Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  shop: [
    { label: 'Electronics & Mobiles', href: '/products?category=electronics' },
    { label: 'Fashion & Apparel', href: '/products?category=fashion' },
    { label: 'Home & Kitchen', href: '/products?category=home' },
    { label: 'Beauty & Personal Care', href: '/products?category=beauty' },
    { label: 'Sports & Fitness', href: '/products?category=sports' },
    { label: 'Browse All Products', href: '/products' },
  ],
  help: [
    { label: 'My Orders', href: '/orders' },
    { label: 'Shopping Cart', href: '/cart' },
    { label: 'Order Tracking', href: '/orders' },
    { label: 'Returns & Refunds', href: '/orders' },
    { label: 'Shipping Policy', href: '/' },
    { label: 'Contact Support', href: '/' },
  ],
  sellers: [
    { label: 'Sell on ShopSphere', href: '/register' },
    { label: 'Seller Portal', href: '/seller' },
    { label: 'Seller Guidelines', href: '/' },
    { label: 'Pricing & Fees', href: '/' },
  ],
};

const trustBadges = [
  { icon: ShieldCheck, title: '100% Genuine', sub: 'Verified Merchants' },
  { icon: Truck, title: 'Free Delivery', sub: 'Orders above ₹999' },
  { icon: Lock, title: 'Secure Checkout', sub: 'Encrypted & Safe' },
  { icon: RotateCcw, title: 'Easy Returns', sub: '30-Day Policy' },
];

export const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#111827', color: '#e5e7eb', marginTop: '4rem' }}>

      {/* Trust strip */}
      <div style={{ background: '#1f2937', borderBottom: '1px solid #374151' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.25rem clamp(1rem, 4vw, 2rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1rem' }}>
          {trustBadges.map(b => {
            const Icon = b.icon;
            return (
              <div key={b.title} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(13,148,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color="#2dd4bf" strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f9fafb' }}>{b.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{b.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main footer grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 'clamp(2rem, 4vw, 3rem)' }}>

          {/* Brand col */}
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color="#fff" />
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em' }}>
                Shop<span style={{ color: '#2dd4bf' }}>Sphere</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.8375rem', color: '#9ca3af', lineHeight: 1.65, marginBottom: '1.5rem', maxWidth: '260px' }}>
              India's premier multi-vendor marketplace. Connecting buyers with thousands of verified independent merchants.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={13} /> support@shopsphere.in
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={13} /> 1800-999-4567 (Toll Free)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={13} /> Bangalore, India
              </div>
            </div>
          </div>

          {/* Shop col */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1.125rem', letterSpacing: '-0.01em' }}>Shop</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.shop.map(l => (
                <li key={l.label}>
                  <Link to={l.href} style={{ fontSize: '0.8375rem', color: '#9ca3af', transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help col */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1.125rem', letterSpacing: '-0.01em' }}>Customer Help</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.help.map(l => (
                <li key={l.label}>
                  <Link to={l.href} style={{ fontSize: '0.8375rem', color: '#9ca3af', transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers col */}
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1.125rem', letterSpacing: '-0.01em' }}>Sell With Us</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.sellers.map(l => (
                <li key={l.label}>
                  <Link to={l.href} style={{ fontSize: '0.8375rem', color: l.label === 'Sell on ShopSphere' ? '#2dd4bf' : '#9ca3af', fontWeight: l.label === 'Sell on ShopSphere' ? 600 : 400, transition: 'color 150ms' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#2dd4bf')}
                    onMouseLeave={e => (e.currentTarget.style.color = l.label === 'Sell on ShopSphere' ? '#2dd4bf' : '#9ca3af')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #1f2937', padding: '1.25rem clamp(1rem, 4vw, 2rem)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem', color: '#6b7280' }}>
        <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span>© {new Date().getFullYear()} ShopSphere Technologies Pvt. Ltd. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={{ color: '#6b7280', transition: 'color 150ms' }} onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Privacy Policy</a>
            <a href="/" style={{ color: '#6b7280', transition: 'color 150ms' }} onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Terms of Use</a>
            <a href="/" style={{ color: '#6b7280', transition: 'color 150ms' }} onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')} onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
