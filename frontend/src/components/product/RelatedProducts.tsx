import React, { useEffect, useState } from 'react';
import { productApi } from '../../api/productApi';
import type { Product } from '../../types';
import { ProductCard } from '../ui/ProductCard';

interface RelatedProductsProps {
  categoryId?: number;
  currentProductId: number;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ categoryId, currentProductId }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productApi
      .getProducts({ categoryId, activeOnly: true })
      .then((products) => {
        const filtered = products.filter((p) => p.id !== currentProductId);
        setProducts(filtered.slice(0, 4));
      })
      .catch(() => setProducts([]));
  }, [categoryId, currentProductId]);

  if (products.length === 0) return null;

  return (
    <section style={{ marginTop: '4rem', borderTop: '1px solid #e2e8f0', paddingTop: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a' }}>Similar Products You Might Like</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Curated items from the same department</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
