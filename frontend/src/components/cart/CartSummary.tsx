import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { formatMoney } from '../../utils/format';
import { ShieldCheck, Lock, RotateCcw, ArrowRight, Tag, Check, Truck, Sparkles } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency?: string;
  onProceedToCheckout: () => void;
  isLoading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  tax,
  total,
  currency,
  onProceedToCheckout,
  isLoading = false,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const freeDeliveryThreshold = 999;
  const isFreeDeliveryUnlocked = subtotal >= freeDeliveryThreshold;
  const remainingForFreeDelivery = freeDeliveryThreshold - subtotal;
  const progressPct = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setIsApplying(true);
    setCouponError('');

    setTimeout(() => {
      if (code === 'WELCOME10' || code === 'SHOPSPHERE' || code === 'SAVE20') {
        setAppliedCoupon(code);
        setCouponError('');
      } else {
        setCouponError(`Coupon code "${code}" is invalid or expired.`);
      }
      setIsApplying(false);
    }, 400);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'sticky',
        top: '5.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.125rem 1.5rem',
          borderBottom: '1px solid #f3f4f6',
          background: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}
      >
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827' }}>
          Order Summary
        </h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0d9488', background: '#f0fdfa', padding: '0.2rem 0.55rem', borderRadius: '999px', border: '1px solid #ccfbf1' }}>
          Standard Order
        </span>
      </div>

      <div style={{ padding: '1.35rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Free Delivery Threshold Progress Bar ── */}
        <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '10px', padding: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, color: '#0f766e', marginBottom: '0.375rem' }}>
            <Truck size={16} color="#0d9488" />
            {isFreeDeliveryUnlocked ? (
              <span>You have unlocked <strong>FREE Express Delivery</strong>!</span>
            ) : (
              <span>Add {formatMoney(remainingForFreeDelivery, currency)} more for <strong>FREE Delivery</strong></span>
            )}
          </div>
          <div style={{ width: '100%', height: 6, background: '#ccfbf1', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0d9488, #059669)',
                borderRadius: '999px',
                transition: 'width 300ms ease'
              }}
            />
          </div>
        </div>

        {/* ── Itemized Price Breakdown ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Items Subtotal</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(subtotal, currency)}</span>
          </div>

          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={13} /> Product Discount
              </span>
              <span>−{formatMoney(discount, currency)}</span>
            </div>
          )}

          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={13} color="#0d9488" /> Promo Coupon ({appliedCoupon})
              </span>
              <span>−{formatMoney(subtotal * 0.1, currency)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Delivery Fee</span>
            {isFreeDeliveryUnlocked ? (
              <span style={{ fontWeight: 800, color: '#059669', background: '#f0fdf4', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.78125rem' }}>
                FREE
              </span>
            ) : (
              <span style={{ fontWeight: 700, color: '#111827' }}>{formatMoney(99, currency)}</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontWeight: 500 }}>Estimated Tax (GST)</span>
            <span style={{ fontWeight: 700, color: '#111827' }}>
              {tax > 0 ? formatMoney(tax, currency) : 'Included'}
            </span>
          </div>
        </div>

        {/* ── Promo Coupon Box ── */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.875rem' }}>
          {appliedCoupon ? (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 700, color: '#166534' }}>
                <Check size={14} color="#16a34a" />
                Coupon {appliedCoupon} Applied!
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter promo coupon..."
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                style={{
                  flex: 1,
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  textTransform: 'uppercase'
                }}
              />
              <Button type="submit" variant="secondary" size="sm" isLoading={isApplying} disabled={!couponCode.trim()}>
                Apply
              </Button>
            </form>
          )}
          {couponError && (
            <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.35rem', fontWeight: 500 }}>
              {couponError}
            </div>
          )}
        </div>

        {/* ── Total Payable Section ── */}
        <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.0625rem', color: '#111827' }}>Total Amount</div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '0.1rem' }}>Final price inclusive of all taxes</div>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.625rem', fontWeight: 900, color: '#0d9488' }}>
            {formatMoney(appliedCoupon ? total * 0.9 : total, currency)}
          </div>
        </div>

        {/* ── Primary CTA Checkout Button ── */}
        <Button
          variant="primary"
          size="lg"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '0.625rem',
            fontWeight: 800,
            fontSize: '1rem',
            padding: '0.875rem',
            boxShadow: '0 6px 20px rgba(13, 148, 136, 0.35)'
          }}
          onClick={onProceedToCheckout}
          isLoading={isLoading}
        >
          Proceed to Checkout <ArrowRight size={18} />
        </Button>

        {/* ── Trust Badges ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#6b7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Lock size={13} color="#0d9488" /> 256-Bit SSL Encrypted & Secure Checkout
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShieldCheck size={13} color="#0d9488" /> Official ShopSphere Buyer Guarantee
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <RotateCcw size={13} color="#0d9488" /> 30-Day Easy Hassle-Free Returns
          </div>
        </div>

      </div>
    </div>
  );
};
