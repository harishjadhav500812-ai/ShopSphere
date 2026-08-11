import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { shippingApi } from '../api/shippingApi';
import { useProductLookup } from '../hooks/useProductLookup';
import type { Order, OrderStatus, Payment, Shipping, ShippingAddressDto } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { formatMoney, formatDateTime } from '../utils/format';
import {
  ArrowLeft, CreditCard, PackageCheck, Truck, Navigation,
  CheckCircle2, Package, MapPin, Copy, Check, AlertTriangle, XCircle, ShoppingBag, Clock, Home, ExternalLink
} from 'lucide-react';

const emptyAddress: ShippingAddressDto = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

interface TimelineStage {
  key: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  status: 'done' | 'current' | 'upcoming';
}

function getTimelineStages(orderStatus: OrderStatus, shippingStatus?: string): { stages: TimelineStage[]; currentIdx: number } {
  const isCancelled = orderStatus === 'CANCELLED';

  let currentIdx = 0;
  switch (orderStatus) {
    case 'PENDING': currentIdx = 0; break;
    case 'CONFIRMED': currentIdx = 1; break;
    case 'PROCESSING': currentIdx = 2; break;
    case 'SHIPPED': currentIdx = 3; break;
    case 'DELIVERED': currentIdx = 5; break;
    default: currentIdx = 0;
  }

  if (shippingStatus === 'SHIPPED' || shippingStatus === 'IN_TRANSIT') {
    currentIdx = Math.max(currentIdx, 3);
  } else if (shippingStatus === 'OUT_FOR_DELIVERY') {
    currentIdx = Math.max(currentIdx, 4);
  } else if (shippingStatus === 'DELIVERED') {
    currentIdx = Math.max(currentIdx, 5);
  }

  const stagesDef = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Order received', icon: ShoppingBag },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Accepted by seller', icon: CheckCircle2 },
    { key: 'PROCESSING', label: 'Processing', desc: 'Packed in warehouse', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', desc: 'Handed to courier', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'With delivery agent', icon: Navigation },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Package delivered', icon: Home },
  ];

  const stages = stagesDef.map((def, idx) => {
    let state: 'done' | 'current' | 'upcoming' = 'upcoming';
    if (isCancelled) {
      state = 'upcoming';
    } else if (idx < currentIdx) {
      state = 'done';
    } else if (idx === currentIdx) {
      state = 'current';
    }
    return {
      key: def.key,
      label: def.label,
      desc: def.desc,
      icon: def.icon,
      status: state,
    };
  });

  return { stages, currentIdx };
}

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { products } = useProductLookup();

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [address, setAddress] = useState<ShippingAddressDto>(emptyAddress);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  const load = useCallback(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    setErrorMessage('');
    orderApi
      .getOrderById(orderId)
      .then((o) => {
        setOrder(o);
        paymentApi.getPayment(orderId).then(setPayment).catch(() => setPayment(null));
        shippingApi.getShipment(orderId).then(setShipping).catch(() => setShipping(null));
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Order not found.'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    setErrorMessage('');
    try {
      const updated = await orderApi.cancelOrder(orderId);
      setOrder(updated);
      setSuccessMessage('Order cancelled successfully.');
      setShowCancelModal(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not cancel the order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingShipment(true);
    setErrorMessage('');
    try {
      const result = await shippingApi.createShipment(orderId, { shippingAddress: address });
      setShipping(result);
      setShowShipmentForm(false);
      setSuccessMessage('Shipment created. Your order is now being processed.');
      const refreshed = await orderApi.getOrderById(orderId);
      setOrder(refreshed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not create the shipment.');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const updateAddress = (field: keyof ShippingAddressDto, value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
        <div style={{ width: '220px', height: '24px', background: '#e5e7eb', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '100%', height: '100px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '100%', height: '180px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div style={{ width: '100%', height: '240px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '100%', height: '240px', background: '#e5e7eb', borderRadius: '16px', animation: 'pulse 1.5s infinite' }} />
        </div>
      </div>
    );
  }

  // 404 / Order Not Found State
  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '20px', padding: '3.5rem 2rem', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <XCircle size={32} color="#dc2626" />
        </div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.375rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
          Order Not Found
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          {errorMessage || 'We couldn\'t find this order or you do not have permission to view it.'}
        </p>
        <Link to="/orders" style={{ textDecoration: 'none' }}>
          <Button variant="primary">Back to My Orders</Button>
        </Link>
      </div>
    );
  }

  const cancellable = order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PROCESSING';
  const canCreateShipment = (order.status === 'CONFIRMED' || order.status === 'PROCESSING') && !shipping;
  const { stages, currentIdx } = getTimelineStages(order.status, shipping?.shippingStatus);

  // Progress line percent calculation
  const progressPercent = Math.min(100, Math.max(0, (currentIdx / (stages.length - 1)) * 100));

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
      
      {/* ── Pulse Animation Keyframes ── */}
      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.45); }
          70% { box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
          100% { box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
        }
        .pulse-active { animation: pulseGlow 1.8s infinite ease-in-out; }
        @media (prefers-reduced-motion: reduce) {
          .pulse-active { animation: none !important; }
        }
      `}</style>

      {/* ── 1. Page Navigation & Header ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link to="/orders" style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0d9488', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={15} /> Back to My Orders
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', border: '1.5px solid #e5e7eb', padding: '1.25rem 1.5rem', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
                Order #SS-2026-000{order.id}
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Placed on {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge status={order.status} />
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      {errorMessage && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', padding: '0.875rem 1.125rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '10px', padding: '0.875rem 1.125rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      {/* ── 2. Hero Order Status Banner ── */}
      <div
        style={{
          background: order.status === 'CANCELLED'
            ? 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)'
            : order.status === 'DELIVERED'
            ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
            : 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
          border: `1.5px solid ${order.status === 'CANCELLED' ? '#fecaca' : order.status === 'DELIVERED' ? '#bbf7d0' : '#ccfbf1'}`,
          borderRadius: '16px',
          padding: '1.375rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '14px',
            background: order.status === 'CANCELLED' ? '#fef2f2' : order.status === 'DELIVERED' ? '#dcfce7' : '#ccfbf1',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            flexShrink: 0
          }}
        >
          {order.status === 'CANCELLED' ? (
            <XCircle size={28} color="#dc2626" />
          ) : order.status === 'DELIVERED' ? (
            <CheckCircle2 size={28} color="#16a34a" />
          ) : order.status === 'SHIPPED' ? (
            <Truck size={28} color="#0d9488" />
          ) : (
            <Package size={28} color="#0d9488" />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            {order.status === 'PENDING' && 'Payment Pending — Awaiting completion'}
            {order.status === 'CONFIRMED' && 'Order Confirmed — Merchant is preparing your items'}
            {order.status === 'PROCESSING' && '📦 Your order is being prepared in the warehouse'}
            {order.status === 'SHIPPED' && '🚚 Your order is on the way! Track its shipment below'}
            {order.status === 'DELIVERED' && '✓ Order Delivered — Enjoy your purchase!'}
            {order.status === 'CANCELLED' && 'Order Cancelled'}
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#4b5563', marginTop: '0.25rem', margin: 0 }}>
            {order.status === 'DELIVERED'
              ? `Delivered on ${shipping?.updatedAt ? formatDateTime(shipping.updatedAt) : formatDateTime(order.updatedAt)}`
              : order.status === 'CANCELLED'
              ? 'This order was cancelled and will not be fulfilled.'
              : 'Estimated delivery: 2–4 business days'}
          </p>
        </div>

        {shipping?.trackingNumber && (
          <div className="desktop-only" style={{ background: '#ffffff', border: '1px solid #ccfbf1', padding: '0.5rem 0.875rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', color: '#0d9488', fontWeight: 800, textTransform: 'uppercase' }}>{shipping.carrier || 'Courier'}</div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{shipping.trackingNumber}</div>
            </div>
            <button
              onClick={() => handleCopyTracking(shipping.trackingNumber)}
              style={{ background: '#f0fdfa', border: 'none', color: '#0d9488', padding: '0.35rem 0.5rem', borderRadius: '6px', cursor: 'pointer' }}
              title="Copy Tracking ID"
            >
              {copiedTracking ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* ── 3. High-Grade Order Tracking Journey Stepper ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1.5px solid #e5e7eb',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Navigation size={20} color="#0d9488" /> Order Tracking Journey
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#6b7280' }}>
              Current Stage: <strong style={{ color: '#0d9488' }}>{order.status}</strong>
            </span>
          </div>
        </div>

        {/* ── Desktop Horizontal Stepper Bar (connected line) ── */}
        <div className="desktop-only" style={{ position: 'relative', padding: '1rem 0.5rem 0.5rem' }}>
          {/* Background Gray Progress Line */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              left: '5%',
              right: '5%',
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '999px',
              zIndex: 1
            }}
          />

          {/* Active Teal Filled Progress Line */}
          <div
            style={{
              position: 'absolute',
              top: '32px',
              left: '5%',
              width: `calc(${progressPercent}% * 0.9)`,
              height: '4px',
              background: '#0d9488',
              borderRadius: '999px',
              transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2
            }}
          />

          {/* Stepper Nodes Container */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
            {stages.map((stage) => {
              const isDone = stage.status === 'done';
              const isCurrent = stage.status === 'current';
              const StageIcon = stage.icon;

              return (
                <div
                  key={stage.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '120px'
                  }}
                >
                  {/* Circle Node Icon */}
                  <div
                    className={isCurrent ? 'pulse-active' : ''}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: isDone ? '#0d9488' : isCurrent ? '#0d9488' : '#ffffff',
                      border: `3px solid ${isDone || isCurrent ? '#0d9488' : '#d1d5db'}`,
                      color: isDone || isCurrent ? '#ffffff' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      position: 'relative',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(13, 148, 136, 0.18)' : '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 250ms ease'
                    }}
                  >
                    <StageIcon size={22} strokeWidth={isCurrent || isDone ? 2.2 : 1.8} />

                    {isDone && (
                      <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: '#ffffff', borderRadius: '50%', padding: '1px', border: '1px solid #0d9488' }}>
                        <CheckCircle2 size={14} color="#0d9488" fill="#ffffff" />
                      </div>
                    )}
                  </div>

                  {/* Stage Name & Subtitle */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: isCurrent ? 900 : isDone ? 700 : 600, color: isCurrent ? '#0d9488' : isDone ? '#111827' : '#9ca3af' }}>
                      {stage.label}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: isCurrent ? '#0f766e' : '#6b7280', marginTop: '0.15rem', lineHeight: 1.3 }}>
                      {stage.desc}
                    </div>

                    {isCurrent && (
                      <span style={{ marginTop: '0.4rem', background: '#0d9488', color: '#ffffff', fontSize: '0.625rem', fontWeight: 800, padding: '0.125rem 0.5rem', borderRadius: '999px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Active Step
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Mobile Vertical Stepper Fallback ── */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stages.map((stage, idx) => {
            const isDone = stage.status === 'done';
            const isCurrent = stage.status === 'current';
            const isLast = idx === stages.length - 1;
            const StageIcon = stage.icon;

            return (
              <div key={stage.key} style={{ display: 'flex', gap: '0.875rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div
                    className={isCurrent ? 'pulse-active' : ''}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isDone ? '#0d9488' : isCurrent ? '#0d9488' : '#ffffff',
                      border: `2px solid ${isDone || isCurrent ? '#0d9488' : '#d1d5db'}`,
                      color: isDone || isCurrent ? '#ffffff' : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center'
                    }}
                  >
                    <StageIcon size={18} />
                  </div>
                  {!isLast && <div style={{ width: 2, flex: 1, minHeight: '1.75rem', background: isDone ? '#0d9488' : '#e5e7eb' }} />}
                </div>

                <div style={{ paddingBottom: isLast ? 0 : '0.75rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: isCurrent || isDone ? 800 : 600, color: isCurrent ? '#0d9488' : isDone ? '#111827' : '#9ca3af' }}>
                    {stage.label} {isCurrent && <span style={{ fontSize: '0.7rem', background: '#0d9488', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.35rem' }}>CURRENT</span>}
                  </div>
                  <div style={{ fontSize: '0.78125rem', color: '#6b7280', marginTop: '0.1rem' }}>
                    {stage.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── 4. Main 2-Column Details Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Items & Pricing Summary */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Your Items ({order.items.length})</span>
            <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: '#6b7280' }}>ID: #{order.id}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {order.items.map((item) => {
              const product = products[item.productId];
              return (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f9fafb', border: '1px solid #f3f4f6', padding: '0.875rem', borderRadius: '12px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '10px', border: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {product?.imageUrl ? (
                      <img src={product.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                    ) : (
                      <Package size={24} color="#9ca3af" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/products/${item.productId}`} style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#111827', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.productName}
                    </Link>
                    <div style={{ fontSize: '0.78125rem', color: '#6b7280', marginTop: '0.15rem' }}>
                      SKU: {item.sku} · Qty: {item.quantity} × {formatMoney(item.unitPriceAmount, item.priceCurrency)}
                    </div>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#111827' }}>
                    {formatMoney(item.lineTotal, item.priceCurrency)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price Details Breakdown */}
          <div style={{ marginTop: '1.5rem', borderTop: '1.5px solid #f3f4f6', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
            <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Price Details
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>−{formatMoney(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
              <span>Tax</span>
              <span style={{ fontWeight: 700 }}>{formatMoney(order.taxAmount, order.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
              <span>Delivery Charges</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #e5e7eb', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>Total Paid</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, color: '#0d9488', fontSize: '1.25rem' }}>
                {formatMoney(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Details & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Delivery Details Card */}
          <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} color="#0d9488" /> Delivery Details
            </h3>

            {shipping ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 600 }}>Delivery Status</span>
                  <Badge status={shipping.shippingStatus} />
                </div>

                {shipping.carrier && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#6b7280' }}>Carrier</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{shipping.carrier}</span>
                  </div>
                )}

                {shipping.trackingNumber ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 800, textTransform: 'uppercase' }}>Tracking ID</div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#111827', fontFamily: 'monospace' }}>{shipping.trackingNumber}</div>
                    </div>
                    <button
                      onClick={() => handleCopyTracking(shipping.trackingNumber)}
                      style={{ background: '#ffffff', border: '1px solid #ccfbf1', color: '#0d9488', padding: '0.35rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      {copiedTracking ? <Check size={13} /> : <Copy size={13} />}
                      {copiedTracking ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78125rem', color: '#6b7280', fontStyle: 'italic' }}>
                    Tracking information will be updated once shipped.
                  </div>
                )}

                {/* Delivery Address Block */}
                <div style={{ marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#111827', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} color="#0d9488" /> Delivering to:
                  </h4>
                  <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 800, color: '#111827' }}>{shipping.shippingAddress.recipientName}</div>
                    <div>{shipping.shippingAddress.addressLine1}</div>
                    {shipping.shippingAddress.addressLine2 && <div>{shipping.shippingAddress.addressLine2}</div>}
                    <div>{shipping.shippingAddress.city}, {shipping.shippingAddress.state} {shipping.shippingAddress.postalCode}</div>
                    <div>{shipping.shippingAddress.country}</div>
                    <div style={{ marginTop: '0.25rem', color: '#6b7280', fontWeight: 600 }}>Phone: {shipping.shippingAddress.phone}</div>
                  </div>
                </div>
              </div>
            ) : canCreateShipment && !showShipmentForm ? (
              <div>
                <p style={{ fontSize: '0.84rem', color: '#6b7280', marginBottom: '1rem' }}>Enter delivery address details to initiate dispatch.</p>
                <Button variant="primary" size="sm" onClick={() => setShowShipmentForm(true)}>Enter Delivery Address</Button>
              </div>
            ) : (
              <p style={{ fontSize: '0.84rem', color: '#6b7280', margin: 0 }}>No shipping details recorded yet.</p>
            )}

            {/* Address Input Form if needed */}
            {showShipmentForm && (
              <form onSubmit={handleCreateShipment} style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Recipient name" value={address.recipientName} onChange={(e) => updateAddress('recipientName', e.target.value)} required />
                <Input label="Phone" value={address.phone} onChange={(e) => updateAddress('phone', e.target.value)} required />
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Address line 1" value={address.addressLine1} onChange={(e) => updateAddress('addressLine1', e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Address line 2 (optional)" value={address.addressLine2 ?? ''} onChange={(e) => updateAddress('addressLine2', e.target.value)} />
                </div>
                <Input label="City" value={address.city} onChange={(e) => updateAddress('city', e.target.value)} required />
                <Input label="State" value={address.state} onChange={(e) => updateAddress('state', e.target.value)} required />
                <Input label="Postal code" value={address.postalCode} onChange={(e) => updateAddress('postalCode', e.target.value)} required />
                <Input label="Country" value={address.country} onChange={(e) => updateAddress('country', e.target.value)} required />
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                  <Button type="submit" variant="primary" isLoading={isCreatingShipment}>
                    {isCreatingShipment ? 'Saving...' : 'Save Address'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowShipmentForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </div>

          {/* Customer-Friendly Payment Card */}
          <div style={{ background: '#ffffff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.0625rem', fontWeight: 800, color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} color="#0d9488" /> Payment Information
            </h3>

            {payment ? (
              <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16a34a', fontWeight: 800, fontSize: '0.9375rem' }}>
                  <CheckCircle2 size={16} /> Payment Successful
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>Payment Method</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{payment.provider || 'Card / UPI'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Amount Paid</span>
                  <span style={{ fontWeight: 800, color: '#0d9488' }}>{formatMoney(payment.amount, payment.currency)}</span>
                </div>

                {payment.transactionId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Transaction ID</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.78125rem' }}>{payment.transactionId}</span>
                  </div>
                )}
              </div>
            ) : order.status === 'PENDING' ? (
              <div>
                <p style={{ fontSize: '0.84rem', color: '#6b7280', marginBottom: '1rem' }}>Payment has not been completed yet.</p>
                <Link to={`/checkout/payment/${order.id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">Pay Now</Button>
                </Link>
              </div>
            ) : (
              <div style={{ fontSize: '0.84rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} /> Verified Payment ({formatMoney(order.totalAmount, order.currency)})
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/products" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="md" style={{ width: '100%', fontWeight: 700 }}>
                Continue Shopping
              </Button>
            </Link>

            {cancellable && (
              <Button
                variant="danger"
                size="md"
                style={{ width: '100%', fontWeight: 700 }}
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>

        </div>

      </div>

      {/* ── Cancel Order Confirmation Modal ── */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 400,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            background: 'rgba(17, 24, 39, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Cancel Order #SS-2026-000{order.id}?
                </h3>
                <span style={{ fontSize: '0.78125rem', color: '#6b7280' }}>This action cannot be undone.</span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>
              Are you sure you want to cancel this order? Your payment will be refunded to your original payment method.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleCancelConfirm}
                isLoading={isCancelling}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
