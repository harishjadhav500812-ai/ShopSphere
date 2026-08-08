import React from 'react';

export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', animation: 'skeletonPulse 1.5s infinite ease-in-out' }}>
      
      {/* Left Gallery Skeleton */}
      <div style={{ height: '420px', background: '#e2e8f0', borderRadius: '12px' }} />

      {/* Right Product Info Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ height: '16px', width: '30%', background: '#cbd5e1', borderRadius: '4px' }} />
        <div style={{ height: '28px', width: '85%', background: '#e2e8f0', borderRadius: '4px' }} />
        <div style={{ height: '20px', width: '40%', background: '#cbd5e1', borderRadius: '4px' }} />
        <div style={{ height: '36px', width: '50%', background: '#e2e8f0', borderRadius: '6px' }} />
        
        <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '20px', width: '60%', background: '#e2e8f0', borderRadius: '4px' }} />
          <div style={{ height: '44px', width: '100%', background: '#cbd5e1', borderRadius: '6px' }} />
        </div>

        <div style={{ height: '80px', width: '100%', background: '#f1f5f9', borderRadius: '8px' }} />
      </div>
    </div>
  );
};
