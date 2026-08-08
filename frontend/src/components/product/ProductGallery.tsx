import React, { useState } from 'react';
import { Package, ShieldCheck } from 'lucide-react';

interface ProductGalleryProps {
  images?: string[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images = [], productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // Use provided images or fallback list
  const galleryImages = images.length > 0 ? images : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Main Image Container */}
      <div
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        style={{
          width: '100%',
          height: '420px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {galleryImages.length > 0 ? (
          <img
            src={galleryImages[selectedIndex]}
            alt={productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '1.5rem',
              transition: 'transform 0.3s ease',
              transform: isZoomed ? 'scale(1.08)' : 'scale(1)',
            }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <Package size={64} style={{ color: '#4f46e5' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>ShopSphere Verified Product</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={14} style={{ color: '#10b981' }} /> 100% Original Brand Guarantee
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails (If multiple images provided) */}
      {galleryImages.length > 1 && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '8px',
                border: selectedIndex === idx ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                background: '#ffffff',
                padding: '0.25rem',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                transform: selectedIndex === idx ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <img src={img} alt={`${productName} thumbnail ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
