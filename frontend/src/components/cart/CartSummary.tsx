import React from 'react';
import { Button } from '../ui/Button';
import { ShieldCheck, Lock, RotateCcw, ArrowRight, Tag } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onProceedToCheckout: () => void;
  isLoading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, discount, tax, total, onProceedToCheckout, isLoading = false }) => {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '5rem' }}>

      {/* Header */}
      <div style={{ padding: '1.125rem 1.375rem', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#111827' }}>Order Summary</h3>
      </div>

      <div style={{ padding: '1.25rem 1.375rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

        {/* Price Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Subtotal (items)</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>₹{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={13} /> Discount Applied</span>
              <span>−₹{discount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>GST & Taxes (est.)</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>₹{tax.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280' }}>Delivery</span>
            <span style={{ fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8125rem' }}>FREE</span>
          </div>
        </div>

        {/* Savings badge */}
        {discount > 0 && (
          <div style={{ background: '#f0fdfa', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.625rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#065f46', fontWeight: 700 }}>
            <Tag size={14} /> You're saving ₹{discount.toLocaleString()} on this order!
          </div>
        )}

        {/* Total */}
        <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Total Payable</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>Inclusive of all taxes</div>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.625rem', fontWeight: 900, color: '#0d9488' }}>
            ₹{total.toLocaleString()}
          </div>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}
          onClick={onProceedToCheckout}
          isLoading={isLoading}
        >
          Proceed to Checkout <ArrowRight size={18} />
        </Button>

        {/* Trust mini-strip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', fontSize: '0.75rem', color: '#9ca3af' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Lock size={12} color="#0d9488" /> Encrypted & Secure Checkout</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><ShieldCheck size={12} color="#0d9488" /> Verified Merchant Guarantee</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><RotateCcw size={12} color="#0d9488" /> 30-Day Easy Returns</div>
        </div>
      </div>
    </div>
  );
};
