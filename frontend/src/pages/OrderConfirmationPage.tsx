import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import { shippingApi } from '../api/shippingApi';
import { useProductLookup } from '../hooks/useProductLookup';
import type { Order, Shipping, PaymentMethod } from '../types';
import { Button } from '../components/ui/Button';
import { formatMoney, formatDateTime } from '../utils/format';
import { OrderStatusTimeline } from '../components/order/OrderStatusTimeline';
import {
  Package, MapPin, ShoppingBag, ArrowRight, ShieldCheck, Truck, Check
} from 'lucide-react';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const location = useLocation();
  const paymentMethod = (location.state as { paymentMethod?: PaymentMethod } | null)?.paymentMethod;
  const { products } = useProductLookup();

  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSparkles, setShowSparkles] = useState(true);

  useEffect(() => {
    if (!orderId || isNaN(orderId)) return;
    setIsLoading(true);
    orderApi
      .getOrderById(orderId)
      .then((o) => {
        setOrder(o);
        shippingApi.getShipment(orderId).then(setShipping).catch(() => setShipping(null));
      })
      .catch((err: unknown) => setErrorMessage(err instanceof Error ? err.message : 'Could not load this order.'))
      .finally(() => setIsLoading(false));

    const timer = setTimeout(() => {
      setShowSparkles(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [orderId]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: '560px', margin: '4rem auto', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #ccfbf1', borderTopColor: '#0d9488', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.125rem', fontWeight: 700, color: '#111827' }}>
          Loading Your Order...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ maxWidth: '560px', margin: '3rem auto', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>We couldn't confirm this order</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{errorMessage || 'The requested order could not be found.'}</p>
        <Link to="/orders"><Button variant="secondary">Go to My Orders</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      
      {/* ── Keyframe Animations Styling ── */}
      <style>{`
        @keyframes pageSlideUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes packagePop {
          0% { opacity: 0; transform: scale(0.85) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes strokeRing {
          0% { stroke-dashoffset: 180; opacity: 0; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes drawCheckmark {
          0% { stroke-dashoffset: 50; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes sparkleBurst {
          0% { opacity: 0; transform: scale(0.5) translate(0, 0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.3) translate(var(--tx), var(--ty)); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .anim-page { animation: pageSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .anim-package { animation: packagePop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s forwards; opacity: 0; }
        .anim-ring { stroke-dasharray: 180; stroke-dashoffset: 180; animation: strokeRing 0.55s cubic-bezier(0.4, 0, 0.2, 1) 0.65s forwards; }
        .anim-check { stroke-dasharray: 50; stroke-dashoffset: 50; animation: drawCheckmark 0.35s ease-out 1.05s forwards; }
        .anim-text-1 { animation: fadeInUp 0.35s ease-out 1.25s forwards; opacity: 0; }
        .anim-text-2 { animation: fadeInUp 0.35s ease-out 1.45s forwards; opacity: 0; }
        .anim-timeline { animation: fadeInUp 0.4s ease-out 1.65s forwards; opacity: 0; }
        .anim-cards { animation: fadeInUp 0.45s ease-out 1.95s forwards; opacity: 0; }
        .anim-actions { animation: fadeInUp 0.35s ease-out 2.25s forwards; opacity: 0; }

        @media (prefers-reduced-motion: reduce) {
          .anim-page, .anim-package, .anim-text-1, .anim-text-2, .anim-timeline, .anim-cards, .anim-actions {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .anim-ring, .anim-check {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="anim-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* ── STEP 2, 3, 4: Package Illustration + Success Checkmark + Sparkles ── */}
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem 0.5rem', position: 'relative' }}>
          
          {/* Subtle Celebration Sparkle Accents */}
          {showSparkles && (
            <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '220px', height: '140px', pointerEvents: 'none', zIndex: 10 }}>
              <div style={{ position: 'absolute', top: '10px', left: '20px', '--tx': '-30px', '--ty': '-25px', animation: 'sparkleBurst 1s ease-out 0.8s forwards' } as React.CSSProperties}>
                <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488' }} />
              </div>
              <div style={{ position: 'absolute', top: '15px', right: '25px', '--tx': '35px', '--ty': '-20px', animation: 'sparkleBurst 1s ease-out 0.85s forwards' } as React.CSSProperties}>
                <span style={{ display: 'block', width: '7px', height: '7px', borderRadius: '50%', background: '#f97316' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '20px', left: '35px', '--tx': '-25px', '--ty': '25px', animation: 'sparkleBurst 1s ease-out 0.9s forwards' } as React.CSSProperties}>
                <span style={{ display: 'block', width: '6px', height: '6px', borderRadius: '50%', background: '#0d9488' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '15px', right: '30px', '--tx': '30px', '--ty': '25px', animation: 'sparkleBurst 1s ease-out 0.95s forwards' } as React.CSSProperties}>
                <span style={{ display: 'block', width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
              </div>
            </div>
          )}

          {/* Package Illustration with Animated Checkmark Overlay */}
          <div className="anim-package" style={{ display: 'inline-flex', position: 'relative', margin: '0 auto 1.25rem' }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                boxShadow: '0 12px 28px rgba(13, 148, 136, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                position: 'relative'
              }}
            >
              <Package size={52} color="#ffffff" strokeWidth={1.8} />

              {/* Animated Success Ring & Checkmark */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  right: '-10px',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center'
                }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                  <circle
                    className="anim-ring"
                    cx="20"
                    cy="20"
                    r="16"
                    fill="#0d9488"
                    stroke="#0d9488"
                    strokeWidth="3"
                  />
                  <path
                    className="anim-check"
                    d="M13 20 L18 25 L27 15"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* ── STEP 4: Success Message ── */}
          <div className="anim-text-1">
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(1.625rem, 4vw, 2.125rem)',
                fontWeight: 900,
                color: '#111827',
                letterSpacing: '-0.02em',
                marginBottom: '0.375rem'
              }}
            >
              Order Placed Successfully!
            </h1>
            <p style={{ color: '#4b5563', fontSize: '0.9375rem', margin: 0 }}>
              Your order has been confirmed and is being prepared by our sellers.
            </p>
          </div>

          {/* ── STEP 5: Real Order Number ── */}
          <div className="anim-text-2" style={{ marginTop: '0.875rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#f0fdfa',
                border: '1.5px solid #ccfbf1',
                color: '#0d9488',
                fontSize: '0.875rem',
                fontWeight: 800,
                padding: '0.35rem 0.875rem',
                borderRadius: '999px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
            >
              <ShieldCheck size={16} /> Order #SS-2026-000{order.id}
            </span>
          </div>

        </div>

        {/* ── STEP 6: Real Delivery Journey Timeline ── */}
        <div
          className="anim-timeline"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Truck size={18} color="#0d9488" /> Delivery Journey
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>
              Placed on {formatDateTime(order.createdAt)}
            </span>
          </div>

          <OrderStatusTimeline orderStatus={order.status} shippingStatus={shipping?.shippingStatus} />
        </div>

        {/* ── STEP 7 & 8: Order Summary Cards & Total Paid ── */}
        <div
          className="anim-cards"
          style={{
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}
        >
          {/* Header Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1.5px solid #f3f4f6', paddingBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.75rem', fontWeight: 900, color: '#0d9488', lineHeight: 1.2 }}>
                {formatMoney(order.totalAmount, order.currency)}
              </div>
            </div>

            {paymentMethod && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Method</div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                  <ShoppingBag size={15} color="#0d9488" /> {paymentMethod.replace('_', ' ')}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Address */}
          {shipping && (
            <div>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={15} color="#0d9488" /> Shipping Address
              </h4>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: '#111827' }}>{shipping.shippingAddress.recipientName}</div>
                <div>{shipping.shippingAddress.addressLine1}{shipping.shippingAddress.addressLine2 ? `, ${shipping.shippingAddress.addressLine2}` : ''}</div>
                <div>{shipping.shippingAddress.city}, {shipping.shippingAddress.state} {shipping.shippingAddress.postalCode}, {shipping.shippingAddress.country}</div>
                <div style={{ marginTop: '0.25rem', color: '#6b7280', fontWeight: 500 }}>Phone: {shipping.shippingAddress.phone}</div>
              </div>
            </div>
          )}

          {/* Purchased Items List */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#111827', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={15} color="#0d9488" /> Purchased Items ({order.items.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {order.items.map((item) => {
                const product = products[item.productId];
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', background: '#f9fafb', border: '1px solid #f3f4f6', padding: '0.625rem 0.875rem', borderRadius: '10px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '8px', border: '1px solid #e5e7eb', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {product?.imageUrl ? (
                        <img src={product.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                      ) : (
                        <Package size={20} color="#9ca3af" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>Qty: {item.quantity} × {formatMoney(item.unitPriceAmount, item.priceCurrency)}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827' }}>{formatMoney(item.lineTotal, item.priceCurrency)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#0f766e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={16} color="#0d9488" style={{ flexShrink: 0 }} />
            <span>We'll email you shipping updates as your order progresses. You can track this order anytime in My Orders.</span>
          </div>

        </div>

        {/* ── STEP 9: Interactive Action Buttons ── */}
        <div className="anim-actions" style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
          <Link to={`/orders/${order.id}`} style={{ flex: 1, textDecoration: 'none' }}>
            <Button variant="primary" size="lg" style={{ width: '100%', display: 'inline-flex', gap: '0.5rem', justifyContent: 'center', fontWeight: 800 }}>
              Track Order <ArrowRight size={17} />
            </Button>
          </Link>
          <Link to="/products" style={{ flex: 1, textDecoration: 'none' }}>
            <Button variant="secondary" size="lg" style={{ width: '100%', fontWeight: 700 }}>
              Continue Shopping
            </Button>
          </Link>
        </div>

      </div>

    </div>
  );
};
