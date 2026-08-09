import React, { useCallback, useEffect, useState } from 'react';
import { couponApi } from '../../api/couponApi';
import type { Coupon, DiscountType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatMoney, formatDateTime } from '../../utils/format';
import { Pencil, PlusCircle, Ticket, Trash2 } from 'lucide-react';

interface CouponFormState {
  id: number | null;
  code: string;
  discountType: DiscountType;
  discountValue: string;
  minimumOrderAmount: string;
  maximumDiscountAmount: string;
  startAt: string;
  expiresAt: string;
  usageLimit: string;
  active: boolean;
}

const emptyForm: CouponFormState = {
  id: null,
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscountAmount: '',
  startAt: '',
  expiresAt: '',
  usageLimit: '',
  active: true,
};

const toInstant = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toLocalInput = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState<CouponFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyCouponId, setBusyCouponId] = useState<number | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');
    couponApi
      .getAdminCoupons()
      .then(setCoupons)
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load coupons.'))
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
    setErrorMessage('');

    const discountValue = Number(form.discountValue);
    if (!form.id && !form.code.trim()) return setErrorMessage('Coupon code is required.');
    if (isNaN(discountValue) || discountValue <= 0) return setErrorMessage('Discount value must be greater than zero.');
    if (form.discountType === 'PERCENTAGE' && discountValue > 100) return setErrorMessage('Percentage discount cannot exceed 100.');

    setIsSaving(true);
    const optionalFields = {
      discountValue,
      minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined,
      maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : undefined,
      startAt: toInstant(form.startAt),
      expiresAt: toInstant(form.expiresAt),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      active: form.active,
    };
    try {
      if (form.id === null) {
        await couponApi.createCoupon({ code: form.code.trim().toUpperCase(), discountType: form.discountType, ...optionalFields });
        notify('Coupon created.');
      } else {
        await couponApi.updateCoupon(form.id, { discountType: form.discountType, ...optionalFields });
        notify('Coupon updated.');
      }
      setForm(null);
      load();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not save the coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    setBusyCouponId(coupon.id);
    setErrorMessage('');
    try {
      const updated = await couponApi.updateCoupon(coupon.id, { active: !coupon.active });
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      notify(updated.active ? 'Coupon activated.' : 'Coupon deactivated.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update the coupon.');
    } finally {
      setBusyCouponId(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}" permanently?`)) return;
    setBusyCouponId(coupon.id);
    setErrorMessage('');
    try {
      await couponApi.deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      notify('Coupon deleted.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete the coupon.');
    } finally {
      setBusyCouponId(null);
    }
  };

  const discountLabel = (coupon: Coupon) =>
    coupon.discountType === 'PERCENTAGE'
      ? `${coupon.discountValue}% off`
      : `${formatMoney(coupon.discountValue, 'USD')} off`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Coupons</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.125rem' }}>Create and manage discount codes</p>
        </div>
        <Button variant="primary" leftIcon={<PlusCircle size={16} />} onClick={() => setForm(emptyForm)}>
          New Coupon
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
            {form.id === null ? 'Create Coupon' : `Edit Coupon #${form.id}`}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {form.id === null && (
              <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="SAVE10" />
            )}
            <Select
              label="Discount type"
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
              options={[
                { label: 'Percentage (%)', value: 'PERCENTAGE' },
                { label: 'Fixed amount', value: 'FIXED_AMOUNT' },
              ]}
            />
            <Input label="Discount value" type="number" step="0.01" min="0.01" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required placeholder="10" />
            <Input label="Min order amount" type="number" step="0.01" min="0" value={form.minimumOrderAmount} onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })} placeholder="Optional" />
            <Input label="Max discount amount" type="number" step="0.01" min="0" value={form.maximumDiscountAmount} onChange={(e) => setForm({ ...form, maximumDiscountAmount: e.target.value })} placeholder="Optional" />
            <Input label="Starts at" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            <Input label="Expires at" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <Input label="Usage limit" type="number" min="1" step={1} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" />
            <div className="form-group">
              <label className="form-label">Active</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                {form.active ? 'Yes' : 'No'}
              </label>
            </div>
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
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '3.5rem 2rem', textAlign: 'center' }}>
          <Ticket size={54} color="#9ca3af" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>No coupons yet</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Create a discount code customers can apply at checkout.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '14px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '760px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Discount</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Usage</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Expires</th>
                <th style={{ textAlign: 'left', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.875rem 1rem', fontWeight: 700, color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{coupon.code}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#374151' }}>{discountLabel(coupon)}</td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>
                    {coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: '#6b7280' }}>{coupon.expiresAt ? formatDateTime(coupon.expiresAt) : 'Never'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span
                      style={{
                        fontSize: '0.6875rem', fontWeight: 700, borderRadius: '999px', padding: '0.2rem 0.625rem',
                        background: coupon.active ? '#ecfdf5' : '#fef2f2',
                        color: coupon.active ? '#059669' : '#dc2626',
                        border: `1px solid ${coupon.active ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    >
                      {coupon.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<Pencil size={13} />}
                        onClick={() =>
                          setForm({
                            id: coupon.id,
                            code: coupon.code,
                            discountType: coupon.discountType,
                            discountValue: String(coupon.discountValue),
                            minimumOrderAmount: coupon.minimumOrderAmount !== undefined && coupon.minimumOrderAmount !== null ? String(coupon.minimumOrderAmount) : '',
                            maximumDiscountAmount: coupon.maximumDiscountAmount !== undefined && coupon.maximumDiscountAmount !== null ? String(coupon.maximumDiscountAmount) : '',
                            startAt: toLocalInput(coupon.startAt),
                            expiresAt: toLocalInput(coupon.expiresAt),
                            usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
                            active: coupon.active,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button variant="secondary" size="xs" onClick={() => handleToggleActive(coupon)} isLoading={busyCouponId === coupon.id}>
                        {coupon.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => handleDelete(coupon)} disabled={busyCouponId === coupon.id} title="Delete">
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
