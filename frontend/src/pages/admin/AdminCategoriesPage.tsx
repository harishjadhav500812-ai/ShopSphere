import React, { useCallback, useEffect, useState } from 'react';
import { categoryApi } from '../../api/categoryApi';
import type { Category } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/format';
import { Layers, Pencil, PlusCircle, Trash2 } from 'lucide-react';

interface CategoryFormState {
  id: number | null;
  name: string;
  description: string;
  parentId: string;
}

const emptyForm: CategoryFormState = { id: null, name: '', description: '', parentId: '' };

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyCategoryId, setBusyCategoryId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');
    categoryApi
      .getAllCategories()
      .then(setCategories)
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load categories.'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const notify = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }
    setIsSaving(true);
    setErrorMessage('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : undefined,
    };
    try {
      if (form.id === null) {
        await categoryApi.createCategory(payload);
        notify('Category created.');
      } else {
        await categoryApi.updateCategory(form.id, payload);
        notify('Category updated.');
      }
      setForm(null);
      load();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save the category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"? Products in this category may be affected.`)) return;
    setBusyCategoryId(category.id);
    setErrorMessage('');
    try {
      await categoryApi.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      notify('Category deleted.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete the category.');
    } finally {
      setBusyCategoryId(null);
    }
  };

  const categoryName = (id?: number) => categories.find((c) => c.id === id)?.name ?? '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Categories</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Organize the product catalog</p>
        </div>
        <Button variant="primary" leftIcon={<PlusCircle size={16} />} onClick={() => setForm(emptyForm)}>
          New Category
        </Button>
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

      {form && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1.5px solid #0d9488', borderRadius: '14px', padding: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>
            {form.id === null ? 'Create Category' : `Edit Category #${form.id}`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
            <Input label="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select
              label="Parent category (optional)"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              options={[
                { label: '— None (top level) —', value: '' },
                ...categories.filter((c) => c.id !== form.id).map((c) => ({ label: c.name, value: c.id })),
              ]}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {isSaving ? 'Saving...' : form.id === null ? 'Create' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading categories...</div>
      ) : categories.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Layers size={54} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>No categories yet</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Create the first category to organize the catalog.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '640px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Parent</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Created</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{category.name}</div>
                    {category.description && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{category.description}</div>}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{category.slug}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{category.parentId ? categoryName(category.parentId) : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{category.createdAt ? formatDate(category.createdAt) : '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Pencil size={13} />}
                        onClick={() =>
                          setForm({
                            id: category.id,
                            name: category.name,
                            description: category.description ?? '',
                            parentId: category.parentId ? String(category.parentId) : '',
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => handleDelete(category)} isLoading={busyCategoryId === category.id} title="Delete">
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
