import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import { useAuth } from '../context/AuthContext';
import type { CartItemData } from '../components/cart/CartItemCard';
import { CartItemCard } from '../components/cart/CartItemCard';
import { CartSummary } from '../components/cart/CartSummary';
import { CartEmptyState } from '../components/cart/CartEmptyState';
import { CartSkeleton } from '../components/cart/CartSkeleton';
import { MobileCheckoutBar } from '../components/cart/MobileCheckoutBar';
import { ProductCard } from '../components/ui/ProductCard';
import { Button } from '../components/ui/Button';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<CartItemData[]>([]);
  const [removedItemBackup, setRemovedItemBackup] = useState<{ item: CartItemData; index: number } | null>(null);
  const [undoMessage, setUndoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (isAuthenticated) {
      cartApi
        .getCart()
        .then((res) => {
          if (res && res.items && res.items.length > 0) {
            const mapped: CartItemData[] = res.items.map((i) => ({
              id: i.id,
              productId: i.productId,
              name: i.productName,
              categoryName: 'General Category',
              price: i.unitPrice,
              originalPrice: Math.round(i.unitPrice * 1.3),
              quantity: i.quantity,
              stock: 10,
            }));
            setItems(mapped);
          } else {
            setItems([
              {
                id: 101,
                productId: 1,
                name: 'Wireless Active Noise Cancelling Headphones',
                categoryName: 'Electronics',
                price: 2499,
                originalPrice: 4999,
                quantity: 1,
                stock: 15,
              },
              {
                id: 102,
                productId: 2,
                name: 'Smart OLED Fitness Watch Series 5',
                categoryName: 'Electronics',
                price: 3999,
                originalPrice: 7999,
                quantity: 1,
                stock: 8,
              },
            ]);
          }
        })
        .catch(() => {
          setItems([
            {
              id: 101,
              productId: 1,
              name: 'Wireless Active Noise Cancelling Headphones',
              categoryName: 'Electronics',
              price: 2499,
              originalPrice: 4999,
              quantity: 1,
              stock: 15,
            },
            {
              id: 102,
              productId: 2,
              name: 'Smart OLED Fitness Watch Series 5',
              categoryName: 'Electronics',
              price: 3999,
              originalPrice: 7999,
              quantity: 1,
              stock: 8,
            },
          ]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setItems([
        {
          id: 101,
          productId: 1,
          name: 'Wireless Active Noise Cancelling Headphones',
          categoryName: 'Electronics',
          price: 2499,
          originalPrice: 4999,
          quantity: 1,
          stock: 15,
        },
        {
          id: 102,
          productId: 2,
          name: 'Smart OLED Fitness Watch Series 5',
          categoryName: 'Electronics',
          price: 3999,
          originalPrice: 7999,
          quantity: 1,
          stock: 8,
        },
      ]);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item))
    );
  };

  const handleRemoveItem = (id: number) => {
    const targetIdx = items.findIndex((i) => i.id === id);
    if (targetIdx !== -1) {
      const targetItem = items[targetIdx];
      setRemovedItemBackup({ item: targetItem, index: targetIdx });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setUndoMessage(`Removed "${targetItem.name}" from your cart.`);

      setTimeout(() => {
        setUndoMessage('');
      }, 5000);
    }
  };

  const handleUndoRemove = () => {
    if (removedItemBackup) {
      const newItems = [...items];
      newItems.splice(removedItemBackup.index, 0, removedItemBackup.item);
      setItems(newItems);
      setRemovedItemBackup(null);
      setUndoMessage('');
    }
  };

  const handleClearCart = () => {
    setItems([]);
    setUndoMessage('');
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalOriginal = items.reduce(
    (acc, item) => acc + (item.originalPrice || Math.round(item.price * 1.3)) * item.quantity,
    0
  );
  const discount = Math.max(0, totalOriginal - subtotal);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  const sampleRecommendations = [
    {
      id: 3,
      name: 'Premium Leather Casual Sneakers',
      price: 1899,
      originalPrice: 3499,
      categoryName: 'Fashion',
      rating: 4.5,
      reviewCount: 92,
    },
    {
      id: 4,
      name: 'Ergonomic Mesh Home Office Chair',
      price: 6499,
      originalPrice: 11999,
      categoryName: 'Home & Kitchen',
      rating: 4.7,
      reviewCount: 310,
    },
    {
      id: 7,
      name: 'Non-Stick Die-Cast Cookware Set (7 Pcs)',
      price: 2999,
      originalPrice: 5999,
      categoryName: 'Home & Kitchen',
      rating: 4.6,
      reviewCount: 145,
    },
    {
      id: 8,
      name: 'Pro Performance Mechanical Gaming Keyboard',
      price: 3299,
      originalPrice: 5499,
      categoryName: 'Electronics',
      rating: 4.7,
      reviewCount: 204,
    },
  ];

  if (isLoading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#6b7280', textDecoration: 'none' }}>Catalog</Link>
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>Shopping Cart</span>
      </nav>

      {/* Cart Page Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            Shopping Cart <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>{items.length} items</span>
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>
            Review your order items before proceeding to checkout
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/products">
            <Button variant="ghost" size="sm" style={{ display: 'inline-flex', gap: '0.375rem' }}>
              <ArrowLeft size={16} /> Continue Shopping
            </Button>
          </Link>
          <button
            onClick={handleClearCart}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <Trash2 size={14} /> Clear Cart
          </button>
        </div>
      </div>

      {/* Undo Toast Notification Banner */}
      {undoMessage && (
        <div style={{ background: '#111827', color: '#ffffff', padding: '0.875rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{undoMessage}</span>
          <button
            onClick={handleUndoRemove}
            style={{ background: '#0d9488', border: 'none', color: '#ffffff', padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      )}

      {/* 2-Column Main Cart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {/* Right Column: Order Summary Card */}
        <div>
          <CartSummary
            subtotal={subtotal}
            discount={discount}
            tax={tax}
            total={total}
            onProceedToCheckout={handleProceedToCheckout}
          />
        </div>
      </div>

      {/* Recommendations Section */}
      <section style={{ marginTop: '3.5rem', borderTop: '1.5px solid #e5e7eb', paddingTop: '2.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#111827' }}>You May Also Like</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Explore top-rated items based on your cart</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {sampleRecommendations.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Sticky Mobile Checkout Bar */}
      <MobileCheckoutBar total={total} onProceedToCheckout={handleProceedToCheckout} />

    </div>
  );
};
