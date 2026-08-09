import React from 'react';
import type { OrderStatus, ShippingStatus } from '../../types';
import { Check, XCircle } from 'lucide-react';

type StepState = 'done' | 'active' | 'pending';

interface TimelineStep {
  key: string;
  label: string;
  state: StepState;
}

const STEP_DEFS: { key: string; label: string }[] = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

/** Derives the unified tracking timeline purely from backend-reported statuses. Never hardcoded. */
function computeSteps(orderStatus: OrderStatus, shippingStatus?: ShippingStatus): TimelineStep[] {
  let doneIndex = 0;
  switch (orderStatus) {
    case 'PENDING': doneIndex = 0; break;
    case 'CONFIRMED': doneIndex = 1; break;
    case 'PROCESSING': doneIndex = 2; break;
    case 'SHIPPED': doneIndex = 3; break;
    case 'DELIVERED': doneIndex = 5; break;
    default: doneIndex = 0;
  }

  if (shippingStatus === 'SHIPPED' || shippingStatus === 'IN_TRANSIT') {
    doneIndex = Math.max(doneIndex, 3);
  } else if (shippingStatus === 'OUT_FOR_DELIVERY') {
    doneIndex = Math.max(doneIndex, 4);
  } else if (shippingStatus === 'DELIVERED') {
    doneIndex = Math.max(doneIndex, 5);
  }

  return STEP_DEFS.map((def, idx) => ({
    key: def.key,
    label: def.label,
    state: idx < doneIndex ? 'done' : idx === doneIndex ? 'active' : 'pending',
  }));
}

interface OrderStatusTimelineProps {
  orderStatus: OrderStatus;
  shippingStatus?: ShippingStatus;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ orderStatus, shippingStatus }) => {
  if (orderStatus === 'CANCELLED') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.125rem', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px' }}>
        <XCircle size={22} color="#dc2626" />
        <div>
          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9375rem' }}>Order Cancelled</div>
          <div style={{ fontSize: '0.8125rem', color: '#991b1b', marginTop: '0.125rem' }}>This order was cancelled and will not be fulfilled.</div>
        </div>
      </div>
    );
  }

  const steps = computeSteps(orderStatus, shippingStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const color = step.state === 'pending' ? '#d1d5db' : '#0d9488';
        const lineColor = step.state === 'done' ? '#0d9488' : '#e5e7eb';
        return (
          <div key={step.key} style={{ display: 'flex', gap: '0.875rem' }}>
            {/* Marker + connecting line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div
                style={{
                  width: step.state === 'active' ? 26 : 22,
                  height: step.state === 'active' ? 26 : 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  background: step.state === 'pending' ? '#fff' : step.state === 'active' ? '#0d9488' : '#ccfbf1',
                  border: `2px solid ${color}`,
                  boxShadow: step.state === 'active' ? '0 0 0 4px rgba(13,148,136,0.15)' : 'none',
                  transition: 'all 200ms',
                }}
              >
                {step.state === 'done' ? (
                  <Check size={13} color="#0d9488" strokeWidth={3} />
                ) : step.state === 'active' ? (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                ) : null}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: '2rem', background: lineColor, transition: 'background 200ms' }} />}
            </div>

            {/* Label */}
            <div style={{ paddingBottom: isLast ? 0 : '1.25rem' }}>
              <div style={{
                fontWeight: step.state === 'pending' ? 500 : 800,
                fontSize: '0.9375rem',
                color: step.state === 'pending' ? '#9ca3af' : '#111827',
              }}>
                {step.label}
              </div>
              {step.state === 'active' && (
                <div style={{ fontSize: '0.75rem', color: '#0d9488', fontWeight: 700, marginTop: '0.125rem' }}>
                  Current status
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
