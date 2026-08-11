import React from 'react';
import { ArrowUpDown } from 'lucide-react';

interface SortControlProps {
  value: string;
  onChange: (sort: string) => void;
}

export const SortControl: React.FC<SortControlProps> = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.375rem 0.75rem', borderRadius: '8px' }}>
      <ArrowUpDown size={14} style={{ color: '#64748b' }} />
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>Sort By:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f172a',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="relevance">Featured & Relevance</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Customer Rating</option>
        <option value="newest">Newest Arrivals</option>
      </select>
    </div>
  );
};
