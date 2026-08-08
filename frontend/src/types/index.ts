// Common Types & API Responses
export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthTokenResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface FieldErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: FieldErrorDetail[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Category
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number;
}

// Product
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  sku: string;
  stock: number;
  sellerId: number;
  categoryId: number;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  currency?: string;
  sku: string;
  stock: number;
  categoryId: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  sku?: string;
  stock?: number;
  categoryId?: number;
}

// Cart
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  currency: string;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  currency: string;
  active: boolean;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Order & Pricing
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  sellerId: number;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  couponCode?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  couponCode?: string;
}

// Payment
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type PaymentProvider = 'SIMULATED';

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

// Coupon
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  active?: boolean;
}

export interface UpdateCouponRequest {
  discountType?: DiscountType;
  discountValue?: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  startAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  active?: boolean;
}

// Shipping
export type ShippingStatus = 'NOT_CREATED' | 'CREATED' | 'READY_TO_SHIP' | 'READY' | 'SHIPPED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface ShippingAddressDto {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Shipping {
  id: number;
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  shippingStatus: ShippingStatus;
  shippingAddress: ShippingAddressDto;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShipmentRequest {
  shippingAddress: ShippingAddressDto;
}

export interface UpdateShippingStatusRequest {
  status: ShippingStatus;
}

export interface TrackingResponse {
  orderId: number;
  trackingNumber?: string;
  carrier?: string;
  shippingStatus: ShippingStatus;
  shippedAt?: string;
  deliveredAt?: string;
  shippingAddress: ShippingAddressDto;
}
