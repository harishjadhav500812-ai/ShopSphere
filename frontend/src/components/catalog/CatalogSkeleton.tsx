import React from 'react';

export const CatalogSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-surface"
          style={{
            height: '340px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'skeletonPulse 1.5s infinite ease-in-out',
          }}
        >
          <div style={{ height: '180px', background: '#e2e8f0' }} />
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1, justifyContent: 'space-between' }}>
            <div>
              <div style={{ height: '12px', width: '40%', background: '#cbd5e1', borderRadius: '4px' }} />
              <div style={{ height: '16px', width: '90%', background: '#e2e8f0', borderRadius: '4px', marginTop: '0.5rem' }} />
              <div style={{ height: '16px', width: '70%', background: '#e2e8f0', borderRadius: '4px', marginTop: '0.25rem' }} />
            </div>
            <div>
              <div style={{ height: '20px', width: '50%', background: '#cbd5e1', borderRadius: '4px', marginBottom: '0.75rem' }} />
              <div style={{ height: '36px', width: '100%', background: '#e2e8f0', borderRadius: '6px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
