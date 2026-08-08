import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export const CartEmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', padding: 'clamp(3rem, 8vw, 5rem) 1rem', maxWidth: '480px', margin: '0 auto' }}>
    <div style={{ width: 80, height: 80, background: '#f0fdfa', border: '2px solid #ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
      <ShoppingCart size={38} color="#0d9488" strokeWidth={1.8} />
    </div>
    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.25rem, 3vw, 1.625rem)', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
      Your Cart is Empty
    </h2>
    <p style={{ fontSize: '0.9375rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '2rem' }}>
      Looks like you haven't added anything yet. Explore our catalog and find something you'll love!
    </p>
    <Link to="/products">
      <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
        Explore Products
      </Button>
    </Link>
  </div>
);
