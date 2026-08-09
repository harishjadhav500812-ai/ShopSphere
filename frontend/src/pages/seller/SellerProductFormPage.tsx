import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import type { Category, CreateProductRequest } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ArrowLeft } from 'lucide-react';

export const SellerProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = id ? Number(id) : null;
  const isEdit = productId !== null && !isNaN(productId);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    categoryApi
      .getAllCategories()
      .then(setCategories)
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load categories.'));

    if (isEdit) {
      productApi
        .getProductById(productId)
        .then((p) => {
          setName(p.name);
          setDescription(p.description ?? '');
          setPrice(String(p.price));
          setPriceCurrency(p.priceCurrency);
          setSku(p.sku);
          setStock(String(p.stock));
          setCategoryId(String(p.categoryId));
          setImageUrl(p.imageUrl ?? '');
        })
        .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load the product.'))
        .finally(() => setIsLoading(false));
    }
  }, [isEdit, productId]);

  const collectFieldErrors = (err: unknown) => {
    const anyErr = err as { fieldErrors?: { field: string; message: string }[] };
    if (anyErr?.fieldErrors) {
      const map: Record<string, string> = {};
      anyErr.fieldErrors.forEach((fe) => {
        map[fe.field] = fe.message;
      });
      setFieldErrors(map);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const priceNumber = Number(price);
    const stockNumber = Number(stock);
    const categoryNumber = Number(categoryId);

    if (!name.trim()) return setErrorMessage('Product name is required.');
    if (isNaN(priceNumber) || priceNumber <= 0) return setErrorMessage('Price must be a positive number.');
    if (isNaN(stockNumber) || stockNumber < 0 || !Number.isInteger(stockNumber)) return setErrorMessage('Stock must be a non-negative whole number.');
    if (!categoryId || isNaN(categoryNumber)) return setErrorMessage('Please select a category.');

    setIsSaving(true);
    try {
      const request: CreateProductRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNumber,
        priceCurrency: priceCurrency.toUpperCase(),
        sku: sku.trim() || undefined,
        stock: stockNumber,
        categoryId: categoryNumber,
        imageUrl: imageUrl.trim() || undefined,
      };
      if (isEdit) {
        await productApi.updateProduct(productId, request);
        navigate('/seller/products');
      } else {
        await productApi.createProduct(request);
        navigate('/seller/products');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save the product.');
      collectFieldErrors(err);
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading product...</div>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
        {isEdit ? 'Edit Product' : 'Create Product'}
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
        {isEdit ? 'Update the details of your listing' : 'Add a new product to your catalog'}
      </p>

      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} error={fieldErrors.name} placeholder="e.g. Wireless Noise-Cancelling Headphones" />

        <div className="form-group">
          <label className="form-label">Description (optional)</label>
          <textarea
            className="input-field"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your product..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required error={fieldErrors.price} placeholder="99.99" />
          <Select
            label="Currency"
            value={priceCurrency}
            onChange={(e) => setPriceCurrency(e.target.value)}
            options={[
              { label: 'USD ($)', value: 'USD' },
              { label: 'INR (₹)', value: 'INR' },
              { label: 'EUR (€)', value: 'EUR' },
              { label: 'GBP (£)', value: 'GBP' },
            ]}
            error={fieldErrors.priceCurrency}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="SKU (optional)" value={sku} onChange={(e) => setSku(e.target.value)} error={fieldErrors.sku} placeholder="e.g. WH-1000XM5" />
          <Input label="Stock" type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} required error={fieldErrors.stock} placeholder="50" />
        </div>

        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          options={[{ label: '— Select a category —', value: '' }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
          error={fieldErrors.categoryId}
        />

        <Input label="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} error={fieldErrors.imageUrl} placeholder="https://..." />

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} style={{ flex: 1 }}>
            {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/seller/products')} leftIcon={<ArrowLeft size={14} />}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
