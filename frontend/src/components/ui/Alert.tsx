import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', message }) => {
  const alertStyles = {
    success: { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399' },
    error: { background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171' },
    warning: { background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#fbbf24' },
    info: { background: 'rgba(99, 102, 241, 0.15)', border: '1px solid #6366f1', color: '#a5b4fc' },
  };

  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', ...alertStyles[type] }}>
      {message}
    </div>
  );
};
