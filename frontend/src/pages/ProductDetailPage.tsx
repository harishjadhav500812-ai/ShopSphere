import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi } from '../api/productApi';
import { cartApi } from '../api/cartApi';
import { categoryApi } from '../api/categoryApi';
import { reviewApi } from '../api/reviewApi';
import { wishlistApi } from '../api/wishlistApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { Category, Product, Review } from '../types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ProductGallery } from '../components/product/ProductGallery';
import { QuantitySelector } from '../components/product/QuantitySelector';
import { ProductDetailSkeleton } from '../components/product/ProductDetailSkeleton';
import { RelatedProducts } from '../components/product/RelatedProducts';
import { formatMoney, formatDateTime } from '../utils/format';
import { Heart, Star, ShoppingBag, ShieldCheck, Truck, Lock, RotateCcw, ArrowLeft, Check, Trash2 } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { refresh: refreshCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cart submission state
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState('');
  const [cartErrorMessage, setCartErrorMessage] = useState('');

  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
  const productId = Number(id);

  const loadReviews = useCallback(() => {
    if (!productId || isNaN(productId)) return;
    reviewApi
      .getProductReviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [productId]);

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

    loadReviews();
  }, [id, loadReviews]);

  // Determine wishlist state for the current customer
  useEffect(() => {
    if (!isCustomer || !productId || isNaN(productId)) return;
    wishlistApi
      .getWishlist()
      .then((wl) => setIsWishlisted(wl.items.some((i) => i.productId === productId)))
      .catch(() => {});
  }, [isCustomer, productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }

    if (!isCustomer) {
      setCartErrorMessage('Only customer accounts can add items to cart.');
      return;
    }

    setIsAddingToCart(true);
    setCartSuccessMessage('');
    setCartErrorMessage('');

    try {
      await cartApi.addItem({ productId: product.id, quantity });
      await refreshCart();
      setCartSuccessMessage(`Added ${quantity} item(s) to your cart!`);
      setTimeout(() => setCartSuccessMessage(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add item to cart. Please try again.';
      setCartErrorMessage(msg);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/products/${product.id}` } } });
      return;
    }
    if (!isCustomer) {
      setCartErrorMessage('Only customer accounts can use the wishlist.');
      return;
    }
    if (!isWishlisted) {
      try {
        await wishlistApi.addItem({ productId: product.id });
        setIsWishlisted(true);
      } catch (err: unknown) {
        setCartErrorMessage(err instanceof Error ? err.message : 'Could not add the product to your wishlist.');
      }
    } else {
      navigate('/wishlist');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSubmittingReview(true);
    setReviewMessage(null);
    try {
      await reviewApi.createReview(product.id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewComment('');
      setReviewMessage({ type: 'success', text: 'Your review has been saved. Thank you!' });
      loadReviews();
      // Refresh product to pick up the new average rating/count
      productApi.getProductById(product.id).then(setProduct).catch(() => {});
    } catch (err: unknown) {
      setReviewMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not save your review.' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteOwnReview = async () => {
    if (!product) return;
    try {
      await reviewApi.deleteOwnReview(product.id);
      setReviewMessage({ type: 'success', text: 'Your review was removed.' });
      loadReviews();
      productApi.getProductById(product.id).then(setProduct).catch(() => {});
    } catch (err: unknown) {
      setReviewMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not remove your review.' });
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
  const inStock = product.active && product.stock > 0;
  const rating = product.averageRating ?? 0;
  const reviewCount = product.reviewCount ?? 0;
  const ownReview = user ? reviews.find((r) => r.userId === user.id) : undefined;

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
        <ProductGallery productName={product.name} images={product.imageUrl ? [product.imageUrl] : []} />

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
              {inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
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
              <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
            </div>
            <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
              {reviewCount} Customer Ratings & Reviews
            </span>
          </div>

          {/* Pricing Block */}
          <div style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', padding: '1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>
              {formatMoney(price, product.priceCurrency)}
            </span>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', width: '100%', marginTop: '0.25rem' }}>
              Inclusive of all taxes. Free Express Shipping available.
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1.5px solid #e5e7eb', paddingTop: '1.25rem' }}>

            <QuantitySelector quantity={quantity} maxQuantity={Math.max(product.stock, 1)} onChange={setQuantity} />

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
                onClick={handleWishlistToggle}
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
          {product.description || 'High-quality product sourced from verified merchant partners.'}
        </p>
      </section>

      {/* Reviews Section */}
      <section style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '12px', padding: '2rem' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
          Ratings & Reviews ({reviews.length})
        </h3>

        {reviewMessage && <Alert type={reviewMessage.type} message={reviewMessage.text} />}

        {/* Review form for customers */}
        {isCustomer ? (
          <form onSubmit={handleSubmitReview} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
              {ownReview ? 'Update your review' : 'Write a review'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReviewRating(value)}
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.125rem' }}
                >
                  <Star size={22} fill={value <= reviewRating ? '#f59e0b' : 'none'} color={value <= reviewRating ? '#f59e0b' : '#d1d5db'} />
                </button>
              ))}
              <span style={{ fontSize: '0.8125rem', color: '#6b7280', marginLeft: '0.375rem' }}>{reviewRating}/5</span>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product (optional)"
              rows={3}
              maxLength={2000}
              className="input-field"
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReview}>
                {ownReview ? 'Update Review' : 'Submit Review'}
              </Button>
              {ownReview && (
                <button
                  type="button"
                  onClick={handleDeleteOwnReview}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Trash2 size={14} /> Delete my review
                </button>
              )}
            </div>
          </form>
        ) : (
          !isAuthenticated && (
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              <Link to="/login" style={{ color: '#0d9488', fontWeight: 700 }}>Sign in</Link> as a customer to write a review.
            </p>
          )
        )}

        {reviews.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>No reviews yet. Be the first to review this product!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((review) => (
              <div key={review.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#fffbeb', border: '1px solid #fef3c7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}>{review.rating}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>{review.userFullName}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{formatDateTime(review.createdAt)}</span>
                </div>
                {review.comment && (
                  <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
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
