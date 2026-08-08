import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onChange: (newQuantity: number) => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity = 99,
  onChange,
}) => {
  const handleDecrement = () => {
    if (quantity > 1) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      onChange(quantity + 1);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>Quantity:</span>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#ffffff',
          border: '1.5px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={handleDecrement}
          disabled={quantity <= 1}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.45rem 0.75rem',
            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
            opacity: quantity <= 1 ? 0.35 : 1,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Minus size={14} />
        </button>

        <span
          style={{
            minWidth: '36px',
            textAlign: 'center',
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#111827',
            userSelect: 'none',
          }}
        >
          {quantity}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={quantity >= maxQuantity}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.45rem 0.75rem',
            cursor: quantity >= maxQuantity ? 'not-allowed' : 'pointer',
            opacity: quantity >= maxQuantity ? 0.35 : 1,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
