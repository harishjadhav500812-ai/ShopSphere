import React from 'react';
import type { OrderStatus, PaymentStatus, ShippingStatus } from '../../types';

interface BadgeProps {
  status: OrderStatus | PaymentStatus | ShippingStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getBadgeClass = (s: string) => {
    switch (s.toUpperCase()) {
      case 'PENDING':
        return 'badge-pending';
      case 'CONFIRMED':
      case 'SUCCESS':
        return 'badge-confirmed';
      case 'PROCESSING':
      case 'READY_TO_SHIP':
      case 'READY':
        return 'badge-processing';
      case 'SHIPPED':
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'badge-shipped';
      case 'DELIVERED':
        return 'badge-delivered';
      case 'CANCELLED':
      case 'FAILED':
        return 'badge-cancelled';
      default:
        return 'badge-pending';
    }
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{status}</span>;
};
