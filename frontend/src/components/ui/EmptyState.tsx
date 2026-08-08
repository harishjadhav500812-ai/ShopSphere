import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionText, onAction }) => {
  return (
    <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', margin: '1rem 0' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.375rem' }}>{title}</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
