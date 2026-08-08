import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginTop: '2.5rem' }}>
      <button
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 0 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f172a',
        }}
      >
        <ChevronLeft size={16} /> Previous
      </button>

      {pages.map((p) => {
        const isCurrent = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: isCurrent ? '1px solid #4f46e5' : '1px solid #e2e8f0',
              background: isCurrent ? '#4f46e5' : '#ffffff',
              color: isCurrent ? '#ffffff' : '#0f172a',
              fontWeight: isCurrent ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            {p + 1}
          </button>
        );
      })}

      <button
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#0f172a',
        }}
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
};
