import React, { useCallback, useEffect, useState } from 'react';
import { addressApi } from '../../api/addressApi';
import type { Address, CreateAddressRequest } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MapPin, Pencil, Plus, CheckCircle2 } from 'lucide-react';

const emptyForm: CreateAddressRequest = {
  label: '',
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
};

interface AddressSelectorProps {
  selectedId: number | null;
  onSelect: (address: Address) => void;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({ selectedId, onSelect }) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateAddressRequest>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');
    addressApi
      .getMyAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length === 0) {
          setShowForm(true);
        } else if (!selectedId) {
          const preferred = list.find((a) => a.isDefault) ?? list[0];
          onSelect(preferred);
        }
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load your addresses.'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      label: address.label ?? '',
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      const payload: CreateAddressRequest = {
        ...form,
        label: form.label?.trim() || undefined,
        addressLine2: form.addressLine2?.trim() || undefined,
      };
      const saved = editingId
        ? await addressApi.updateAddress(editingId, payload)
        : await addressApi.createAddress(payload);

      const nextList = editingId
        ? addresses.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...addresses];
      setAddresses(nextList);
      setShowForm(false);
      onSelect(saved);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save this address.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Loading your addresses...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}>
          <strong>!</strong> {errorMessage}
        </div>
      )}

      {addresses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {addresses.map((address) => {
            const active = selectedId === address.id;
            return (
              <button
                key={address.id}
                type="button"
                onClick={() => onSelect(address)}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  padding: '0.9375rem 1.0625rem',
                  borderRadius: '10px',
                  border: active ? '2px solid #0d9488' : '1.5px solid #e5e7eb',
                  background: active ? '#f0fdfa' : '#fff',
                  cursor: 'pointer',
                  transition: 'border-color 150ms, background 150ms',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '0.125rem', color: active ? '#0d9488' : '#9ca3af' }}>
                  {active ? <CheckCircle2 size={20} /> : <MapPin size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem' }}>{address.recipientName}</span>
                    {address.label && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0d9488', background: '#ccfbf1', borderRadius: '999px', padding: '0.1rem 0.55rem', textTransform: 'uppercase' }}>
                        {address.label}
                      </span>
                    )}
                    {address.isDefault && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: '999px', padding: '0.1rem 0.55rem' }}>
                        Default
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: 1.5 }}>
                    {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
                    {address.city}, {address.state} {address.postalCode}, {address.country}<br />
                    Phone: {address.phone}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEdit(address); }}
                  style={{ flexShrink: 0, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  <Pencil size={13} /> Edit
                </button>
              </button>
            );
          })}
        </div>
      )}

      {!showForm && (
        <Button variant="outline" size="sm" onClick={startAdd} style={{ alignSelf: 'flex-start', display: 'inline-flex', gap: '0.375rem' }}>
          <Plus size={14} /> Add a new address
        </Button>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ border: '1.5px solid #0d9488', borderRadius: '10px', padding: '1.125rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', background: '#f9fffe' }}
        >
          <div style={{ gridColumn: '1 / -1', fontWeight: 800, color: '#111827', fontSize: '0.9375rem', marginBottom: '-0.25rem' }}>
            {editingId ? 'Edit Address' : 'Add a New Address'}
          </div>
          <Input label="Label (optional)" placeholder="Home, Work…" value={form.label ?? ''} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <Input label="Recipient name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Address line 1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} required />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Address line 2 (optional)" value={form.addressLine2 ?? ''} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
          </div>
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          <Input label="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
          <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
          <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#374151', fontWeight: 600 }}>
            <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default address
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Save Address'}
            </Button>
            {addresses.length > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};
