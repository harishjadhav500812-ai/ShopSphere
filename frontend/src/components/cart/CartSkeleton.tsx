import React from 'react';

export const CartSkeleton: React.FC = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', animation: 'skeletonPulse 1.5s infinite ease-in-out' }}>
      
      {/* Items List Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-surface" style={{ padding: '1.25rem', height: '130px', display: 'flex', gap: '1rem' }}>
            <div style={{ width: '100px', height: '100%', background: '#e2e8f0', borderRadius: '8px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
              <div style={{ height: '14px', width: '30%', background: '#cbd5e1', borderRadius: '4px' }} />
              <div style={{ height: '18px', width: '70%', background: '#e2e8f0', borderRadius: '4px' }} />
              <div style={{ height: '16px', width: '40%', background: '#cbd5e1', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Skeleton */}
      <div className="card-surface" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ height: '20px', width: '50%', background: '#cbd5e1', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '80%', background: '#e2e8f0', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '60%', background: '#e2e8f0', borderRadius: '4px' }} />
        <div style={{ height: '14px', width: '90%', background: '#e2e8f0', borderRadius: '4px' }} />
        <div style={{ height: '44px', width: '100%', background: '#cbd5e1', borderRadius: '6px', marginTop: 'auto' }} />
      </div>
    </div>
  );
};
