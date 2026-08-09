import React from 'react';
import type { PaymentMethod } from '../../types';
import { CreditCard, Smartphone, Landmark, Wallet, Banknote, ShieldCheck } from 'lucide-react';

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const OPTIONS: PaymentMethodOption[] = [
  { value: 'CARD', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: <CreditCard size={18} /> },
  { value: 'UPI', label: 'UPI', description: 'Pay via any UPI app', icon: <Smartphone size={18} /> },
  { value: 'NET_BANKING', label: 'Net Banking', description: 'All major banks', icon: <Landmark size={18} /> },
  { value: 'WALLET', label: 'Wallet', description: 'ShopSphere Wallet & partners', icon: <Wallet size={18} /> },
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives', icon: <Banknote size={18} /> },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.625rem' }}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 0.875rem',
                borderRadius: '10px',
                border: active ? '2px solid #0d9488' : '1.5px solid #e5e7eb',
                background: active ? '#f0fdfa' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 150ms, background 150ms',
              }}
            >
              <span style={{ color: active ? '#0d9488' : '#9ca3af', flexShrink: 0 }}>{opt.icon}</span>
              <span style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8375rem', color: '#111827' }}>{opt.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{opt.description}</div>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
        <ShieldCheck size={13} color="#0d9488" />
        Sandbox mode: payments are simulated for development. No real charge will be made.
      </div>
    </div>
  );
};
