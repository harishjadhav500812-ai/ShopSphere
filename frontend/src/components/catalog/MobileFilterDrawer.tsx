import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCount?: number;
  onClearAll?: () => void;
  children: React.ReactNode;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  activeCount = 0,
  onClearAll,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'flex',
        justify: 'flex-end',
        background: 'rgba(17, 24, 39, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '88%',
          maxWidth: '380px',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-6px 0 24px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            padding: '1.125rem 1.25rem',
            borderBottom: '1px solid #f3f4f6',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#111827', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Filter Products
            </h3>
            {activeCount > 0 && (
              <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                {activeCount} active
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px' }}
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Filter Body */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>
          {children}
        </div>

        {/* Sticky Footer CTA */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1.5px solid #e5e7eb',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {onClearAll && (
            <Button
              variant="outline"
              size="md"
              style={{ flex: 1 }}
              onClick={() => { onClearAll(); onClose(); }}
            >
              Clear All
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            style={{ flex: 2, display: 'inline-flex', gap: '0.375rem', fontWeight: 700 }}
            onClick={onClose}
          >
            <Check size={16} /> Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};
