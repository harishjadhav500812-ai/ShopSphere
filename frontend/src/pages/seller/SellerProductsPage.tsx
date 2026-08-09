import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productApi } from '../../api/productApi';
import type { Product } from '../../types';
import { Button } from '../../components/ui/Button';
import { formatMoney } from '../../utils/format';
import { Package, Pencil, PlusCircle, Trash2 } from 'lucide-react';

export const SellerProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});

  const load = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage('');
    productApi
      .getProducts()
      .then((all) => setProducts(all.filter((p) => p.sellerId === user.id)))
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load your products.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleActive = async (product: Product) => {
    setBusyProductId(product.id);
    setErrorMessage('');
    try {
      const updated = await productApi.updateProductStatus(product.id, { active: !product.active });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      notify(updated.active ? 'Product activated.' : 'Product deactivated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update product status.');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleSaveStock = async (product: Product) => {
    const raw = stockEdits[product.id];
    if (raw === undefined || raw === '') return;
    const quantity = Number(raw);
    if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
      setErrorMessage('Stock must be a non-negative whole number.');
      return;
    }
    setBusyProductId(product.id);
    setErrorMessage('');
    try {
      const updated = await productApi.updateStock(product.id, { quantity });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setStockEdits((prev) => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
      notify('Stock updated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update stock.');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}" permanently? This cannot be undone.`)) return;
    setBusyProductId(product.id);
    setErrorMessage('');
    try {
      await productApi.deleteProduct(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      notify('Product deleted.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete the product.');
    } finally {
      setBusyProductId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>My Products</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Manage your seller catalog</p>
        </div>
        <Link to="/seller/products/new" style={{ textDecoration: 'none' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0d9488', color: '#fff', fontWeight: 700, fontSize: '0.875rem', padding: '0.6rem 1.125rem', borderRadius: '8px' }}>
            <PlusCircle size={16} /> New Product
          </span>
        </Link>
      </div>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Package size={54} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>No products yet</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first product to start selling on ShopSphere.</p>
          <Link to="/seller/products/new" style={{ color: '#0d9488', fontWeight: 700 }}>Create Product →</Link>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Product</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Price</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Stock</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <Link to={`/products/${product.id}`} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>{product.name}</Link>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>SKU: {product.sku}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{formatMoney(product.price, product.priceCurrency)}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        className="input-field"
                        style={{ width: '5.5rem', padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                        value={stockEdits[product.id] ?? product.stock}
                        onChange={(e) => setStockEdits((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      />
                      {stockEdits[product.id] !== undefined && stockEdits[product.id] !== '' && Number(stockEdits[product.id]) !== product.stock && (
                        <Button variant="primary" size="xs" onClick={() => handleSaveStock(product)} isLoading={busyProductId === product.id}>
                          Save
                        </Button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem', fontWeight: 700, borderRadius: '999px', padding: '0.2rem 0.625rem',
                        background: product.active ? '#ecfdf5' : '#fef2f2',
                        color: product.active ? '#059669' : '#dc2626',
                        border: `1px solid ${product.active ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {product.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Link to={`/seller/products/${product.id}/edit`}>
                        <Button variant="outline" size="xs" title="Edit"><Pencil size={13} /> Edit</Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleToggleActive(product)}
                        isLoading={busyProductId === product.id}
                      >
                        {product.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => handleDelete(product)} disabled={busyProductId === product.id} title="Delete">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
