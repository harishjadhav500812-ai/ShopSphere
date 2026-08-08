import React from 'react';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

interface MobileCheckoutBarProps {
  total: number;
  onProceedToCheckout: () => void;
  isLoading?: boolean;
}

export const MobileCheckoutBar: React.FC<MobileCheckoutBarProps> = ({
  total,
  onProceedToCheckout,
  isLoading = false,
}) => {
  const currencySymbol = '₹';

  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1.5px solid #e5e7eb',
        padding: '0.875rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 -4px 14px rgba(0,0,0,0.08)',
        zIndex: 90,
      }}
    >
      <div>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>Total Payable</span>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 900, color: '#0d9488' }}>
          {currencySymbol}{total.toLocaleString()}
        </div>
      </div>

      <Button
        variant="primary"
        size="md"
        style={{ display: 'inline-flex', gap: '0.375rem' }}
        onClick={onProceedToCheckout}
        isLoading={isLoading}
      >
        Checkout <ArrowRight size={16} />
      </Button>
    </div>
  );
};
