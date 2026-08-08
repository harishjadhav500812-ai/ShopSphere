import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, extra, children, className = '' }) => {
  return (
    <div className={`card-surface ${className}`} style={{ padding: '1.5rem' }}>
      {(title || extra) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.875rem' }}>
          <div>
            {title && <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>}
            {subtitle && <p style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.125rem' }}>{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
