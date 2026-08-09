import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { categoryApi } from '../../api/categoryApi';
import type { Category } from '../../types';
import { Button } from '../ui/Button';
import {
  ShoppingBag, Search, User, LogOut, Heart,
  Menu, X, Sparkles, ChevronDown, Truck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  React.useEffect(() => {
    categoryApi.getAllCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  React.useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('categoryId') || 'all');
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
    navigate(`/products?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      {/* ── Top Strip ── */}
      <div style={{ background: '#0d9488', color: '#fff', textAlign: 'center', fontSize: '0.75rem', fontWeight: 500, padding: '0.375rem 1rem', letterSpacing: '0.01em' }}>
        <Truck size={12} style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }} />
        Free delivery on orders above ₹999 &nbsp;·&nbsp; Easy 30-day returns
      </div>

      {/* ── Main Bar ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem clamp(1rem, 4vw, 2rem)', display: 'flex', alignItems: 'center', gap: '1rem' }}>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobile-only"
          style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px', flexShrink: 0 }}
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(13,148,136,0.3)',
          }}>
            <ShoppingBag size={20} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.375rem', color: '#111827', letterSpacing: '-0.02em' }}>
            Shop<span style={{ color: '#0d9488' }}>Sphere</span>
          </span>
        </Link>

        {/* ── Search Bar (desktop) ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="desktop-only"
          style={{ flex: 1, maxWidth: 600, display: 'flex', alignItems: 'stretch', border: '2px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#f9fafb', transition: 'border-color 200ms' }}
          onFocus={() => { const el = document.querySelector('.search-form') as HTMLElement; if (el) el.style.borderColor = '#0d9488'; }}
        >
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ background: '#f3f4f6', border: 'none', borderRight: '1px solid #e5e7eb', padding: '0 0.875rem', fontSize: '0.8125rem', color: '#374151', cursor: 'pointer', fontWeight: 500, outline: 'none', maxWidth: 160 }}
          >
            <option value="all">All Departments</option>
            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>

          <input
            type="text"
            placeholder="Search for products, brands and more..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 0.875rem', fontSize: '0.875rem', color: '#111827', outline: 'none', minWidth: 0 }}
          />

          <button
            type="submit"
            style={{ background: '#0d9488', border: 'none', color: '#fff', padding: '0 1.125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, fontSize: '0.875rem', transition: 'background 180ms' }}
            className="btn-press"
          >
            <Search size={16} />
          </button>
        </form>

        {/* ── Right Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexShrink: 0 }}>

          {/* Wishlist icon */}
          <Link
            to="/wishlist"
            className="desktop-only"
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', fontWeight: 500, transition: 'background 150ms' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            aria-label="Wishlist"
          >
            <Heart size={20} />
          </Link>

          {/* User account */}
          {isAuthenticated && user ? (
            <div style={{ position: 'relative' }} className="desktop-only">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{ background: 'none', border: '1.5px solid #e5e7eb', color: '#374151', cursor: 'pointer', padding: '0.45rem 0.875rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.color = '#0d9488'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
              >
                <User size={15} />
                {user.fullName.split(' ')[0]}
                <ChevronDown size={13} style={{ opacity: 0.6 }} />
              </button>

              {isUserMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 200, zIndex: 200, padding: '0.5rem' }}>
                  <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid #f3f4f6', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600, marginTop: '0.125rem' }}>{user.role}</div>
                  </div>
                  {user.role === 'CUSTOMER' && <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', fontWeight: 500, transition: 'background 130ms' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>My Orders</Link>}
                  {user.role === 'CUSTOMER' && <Link to="/wishlist" onClick={() => setIsUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', fontWeight: 500, transition: 'background 130ms' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>My Wishlist</Link>}
                  {user.role === 'SELLER' && <Link to="/seller" onClick={() => setIsUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', fontWeight: 500, transition: 'background 130ms' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Seller Dashboard</Link>}
                  {user.role === 'ADMIN' && <Link to="/admin" onClick={() => setIsUserMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem', color: '#374151', fontWeight: 500, transition: 'background 130ms' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Admin Panel</Link>}
                  <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '6px', fontSize: '0.875rem', color: '#dc2626', fontWeight: 600, cursor: 'pointer', marginTop: '0.25rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.625rem', transition: 'background 130ms' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button variant="primary" size="sm">Join Free</Button></Link>
            </div>
          )}

          {/* Cart Button */}
          <Link
            to="/cart"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdfa', color: '#0d9488', border: '1.5px solid #ccfbf1', padding: '0.5rem 0.875rem', borderRadius: '9px', fontWeight: 700, fontSize: '0.875rem', transition: 'all 180ms', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0d9488'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f0fdfa'; (e.currentTarget as HTMLElement).style.color = '#0d9488'; }}
          >
            <ShoppingBag size={18} />
            <span>Cart</span>
            <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.6875rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '999px', minWidth: '18px', textAlign: 'center' }} className="badge-animating">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>

      {/* ── Category Nav Ribbon (desktop) ── */}
      <nav
        className="desktop-only"
        style={{ background: '#fff', borderTop: '1px solid #f3f4f6', padding: '0 clamp(1rem, 4vw, 2rem)' }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 0, fontSize: '0.8375rem', fontWeight: 500, color: '#374151', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Link to="/products" style={{ padding: '0.625rem 1rem', color: '#111827', fontWeight: 700, borderBottom: '2px solid #0d9488', display: 'inline-flex', alignItems: 'center' }}>All Products</Link>
          {categories.slice(0, 7).map(cat => (
            <Link
              key={cat.id}
              to={`/products?categoryId=${cat.id}`}
              style={{ padding: '0.625rem 1rem', color: '#374151', borderBottom: '2px solid transparent', display: 'inline-flex', alignItems: 'center', transition: 'color 150ms, border-color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#0d9488'; (e.currentTarget as HTMLElement).style.borderBottomColor = '#0d9488'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#374151'; (e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent'; }}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            to="/products"
            style={{ padding: '0.625rem 1rem', color: '#f97316', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderBottom: '2px solid transparent', transition: 'border-color 150ms' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderBottomColor = '#f97316')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderBottomColor = 'transparent')}
          >
            <Sparkles size={13} /> Today's Deals
          </Link>
        </div>
      </nav>

      {/* ── Mobile Search Bar ── */}
      <div className="mobile-only" style={{ padding: '0.625rem 1rem', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.6rem 0.875rem', fontSize: '0.875rem', color: '#111827', outline: 'none' }}
          />
          <button type="submit" style={{ background: '#0d9488', border: 'none', color: '#fff', padding: '0.6rem 1rem', cursor: 'pointer' }}>
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* ── Mobile Slide-Down Menu ── */}
      {isMobileMenuOpen && (
        <div className="mobile-only" style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'slideUp 0.2s ease' }}>
          {isAuthenticated && user ? (
            <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '10px', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{user.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 600 }}>{user.role}</div>
              </div>
              <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #dc2626', color: '#dc2626', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" style={{ flex: 1 }} onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" style={{ width: '100%' }}>Sign In</Button>
              </Link>
              <Link to="/register" style={{ flex: 1 }} onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" style={{ width: '100%' }}>Join Free</Button>
              </Link>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categories.slice(0, 6).map(cat => (
              <Link key={cat.id} to={`/products?categoryId=${cat.id}`} onClick={() => setIsMobileMenuOpen(false)}
                style={{ padding: '0.4rem 0.875rem', background: '#f3f4f6', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500, color: '#374151' }}>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
