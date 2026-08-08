import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { cartApi } from '../api/cartApi';
import { categoryApi } from '../api/categoryApi';
import { useAuth } from '../context/AuthContext';
import type { Category, Product } from '../types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ProductGallery } from '../components/product/ProductGallery';
import { QuantitySelector } from '../components/product/QuantitySelector';
import { ProductDetailSkeleton } from '../components/product/ProductDetailSkeleton';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { Heart, Star, ShoppingBag, ShieldCheck, Truck, Lock, RotateCcw, ArrowLeft, Check, Sparkles } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Cart submission state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState('');
  const [cartErrorMessage, setCartErrorMessage] = useState('');

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    productApi
      .getProductById(Number(id))
      .then((prod) => {
        setProduct(prod);
        if (prod.categoryId) {
          categoryApi
            .getAllCategories()
            .then((cats) => {
              const matched = cats.find((c) => c.id === prod.categoryId);
              if (matched) setCategory(matched);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setIsError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    if (user?.role !== 'CUSTOMER') {
      setCartErrorMessage('Only customer accounts can add items to cart.');
      return;
    }

    setIsAddingToCart(true);
    setCartSuccessMessage('');
    setCartErrorMessage('');

    try {
      await cartApi.addItem({ productId: product.id, quantity });
      setCartSuccessMessage(`Added ${quantity} item(s) to your cart!`);
      setTimeout(() => setCartSuccessMessage(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to cart. Please try again.';
      setCartErrorMessage(msg);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (isError || !product) {
    return (
      <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '4rem 2rem', textAlign: 'center', maxWidth: '540px', margin: '3rem auto' }}>
        <div style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <ShoppingBag size={54} />
        </div>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Product Unavailable
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '2rem' }}>
          This product may have been removed or is no longer available in the catalog.
        </p>
        <Link to="/products">
          <Button variant="primary" style={{ display: 'inline-flex', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  const price = product.price || 0;
  const originalPrice = Math.round(price * 1.3);
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  const currencySymbol = product.currency === 'USD' ? '$' : '₹';
  const inStock = product.stock === undefined || product.stock > 0;
  const rating = 4.5;
  const reviewCount = 124;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#6b7280', textDecoration: 'none' }}>Catalog</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/products?categoryId=${category.id}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Alert Messages */}
      {cartSuccessMessage && <Alert type="success" message={cartSuccessMessage} />}
      {cartErrorMessage && <Alert type="error" message={cartErrorMessage} />}

      {/* Main 2-Column Product Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        
        {/* Left Column: Image Gallery */}
        <ProductGallery productName={product.name} />

        {/* Right Column: Product Information & Purchase Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Category & Stock Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {category ? category.name : 'Verified Product'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: inStock ? '#059669' : '#dc2626',
                background: inStock ? '#ecfdf5' : '#fef2f2',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: inStock ? '1px solid #a7f3d0' : '1px solid #fecaca',
              }}
            >
              {inStock ? `In Stock (${product.stock ?? 'Available'})` : 'Out of Stock'}
            </span>
          </div>

          {/* Product Title */}
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 1.875rem)', fontWeight: 800, color: '#111827', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#fffbeb', color: '#d97706', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #fef3c7', fontSize: '0.875rem', fontWeight: 700 }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
              {reviewCount} Verified Customer Ratings & Reviews
            </span>
          </div>

          {/* Pricing Block */}
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>
              {currencySymbol}{price.toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <>
                <span style={{ fontSize: '1.125rem', color: '#9ca3af', textDecoration: 'line-through' }}>
                  {currencySymbol}{originalPrice.toLocaleString()}
                </span>
                <span style={{ background: '#f97316', color: '#ffffff', fontSize: '0.8125rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {discountPercent}% OFF
                </span>
              </>
            )}
            <div style={{ fontSize: '0.75rem', color: '#6b7280', width: '100%', marginTop: '0.25rem' }}>
              Inclusive of all taxes. Free Express Shipping available.
            </div>
          </div>

          {/* Limited Coupon Offer Highlight */}
          <div style={{ background: '#fff7ed', border: '1px dashed #fdba74', padding: '0.875rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={20} style={{ color: '#ea580c' }} />
            <span style={{ fontSize: '0.875rem', color: '#9a3412' }}>
              Use code <strong style={{ background: '#ea580c', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>SAVE10</strong> at checkout for 10% instant discount!
            </span>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1.5px solid #e5e7eb', paddingTop: '1.25rem' }}>
            
            <QuantitySelector quantity={quantity} maxQuantity={product.stock || 10} onChange={setQuantity} />

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={!inStock || isAddingToCart}
                isLoading={isAddingToCart}
                onClick={handleAddToCart}
              >
                {cartSuccessMessage ? <Check size={18} /> : <ShoppingBag size={18} />}
                {cartSuccessMessage ? 'Added to Cart ✓' : 'Add to Cart'}
              </Button>

              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Add to wishlist"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isWishlisted ? '#dc2626' : '#111827',
                  transition: 'all 0.2s ease',
                }}
              >
                <Heart size={18} fill={isWishlisted ? '#dc2626' : 'none'} />
                {isWishlisted ? 'Saved' : 'Wishlist'}
              </button>
            </div>
          </div>

          {/* Trust Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#4b5563' }}>
              <ShieldCheck size={18} style={{ color: '#0d9488' }} />
              <span>100% Original Product</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#4b5563' }}>
              <Truck size={18} style={{ color: '#0d9488' }} />
              <span>Express Delivery</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#4b5563' }}>
              <Lock size={18} style={{ color: '#0d9488' }} />
              <span>Secure Payment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#4b5563' }}>
              <RotateCcw size={18} style={{ color: '#0d9488' }} />
              <span>Easy Return Policy</span>
            </div>
          </div>

        </div>
      </div>

      {/* Product Description Section */}
      <section style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '2rem', marginTop: '2rem' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
          Product Overview & Description
        </h3>
        <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {product.description || 'High-quality product sourced from verified merchant partners. Built with premium materials to ensure optimal durability and performance.'}
        </p>
      </section>

      {/* Specifications Table */}
      <section style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '2rem' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
          Product Specifications
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>Product ID:</span>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>#{product.id}</span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>SKU Code:</span>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{product.sku}</span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>Department:</span>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{category ? category.name : 'General'}</span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>Stock Units:</span>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{product.stock} available</span>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.5rem' }}>
            <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', fontSize: '0.875rem' }}>Seller Store ID:</span>
            <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Merchant #{product.sellerId}</span>
          </div>
        </div>
      </section>

      {/* Related Products Grid */}
      <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />

    </div>
  );
};
