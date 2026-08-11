// Common Types & API Responses — aligned with backend DTOs
export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

// POST /api/auth/login response
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
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

// POST /api/users/register response
export interface RegisterResponse {
  user: User;
  verificationRequired: boolean;
  mailConfigured: boolean;
  devVerificationCode?: string | null;
}

// POST /api/auth/verify-email
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// POST /api/auth/resend-verification response
export interface ResendVerificationResponse {
  email: string;
  mailConfigured: boolean;
  devVerificationCode?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  parentId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
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
  priceCurrency: string;
  sku: string;
  stock: number;
  active: boolean;
  sellerId: number;
  categoryId: number;
  imageUrl?: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  sku?: string;
  stock: number;
  categoryId: number;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  priceCurrency?: string;
  sku?: string;
  stock?: number;
  categoryId?: number;
  imageUrl?: string;
}

export interface UpdateProductStatusRequest {
  active: boolean;
}

export interface UpdateStockRequest {
  quantity: number;
}

// Cart
export interface CartItem {
  itemId: number;
  productId: number;
  sku: string;
  productName: string;
  priceAmount: number;
  priceCurrency: string;
  quantity: number;
  available: boolean;
  imageUrl?: string;
  categoryName?: string;
  stock?: number;
  averageRating?: number;
  reviewCount?: number;
  originalPrice?: number;
}

// Search Suggestions
export interface ProductSuggestionDto {
  id: number;
  name: string;
  price: number;
  priceCurrency: string;
  imageUrl?: string;
  categoryName?: string;
}

export interface CategorySuggestionDto {
  id: number;
  name: string;
  slug: string;
}

export interface SearchSuggestionsResponse {
  products: ProductSuggestionDto[];
  categories: CategorySuggestionDto[];
  brands: string[];
}

export interface Cart {
  cartId: number | null;
  items: CartItem[];
  totals: Record<string, number>;
  itemCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Wishlist
export interface WishlistItem {
  itemId: number;
  productId: number;
  productName: string;
  priceAmount: number;
  priceCurrency: string;
  available: boolean;
  addedAt: string;
}

export interface Wishlist {
  wishlistId: number | null;
  itemCount: number;
  items: WishlistItem[];
}

export interface AddWishlistItemRequest {
  productId: number;
}

// Reviews
export interface Review {
  id: number;
  productId: number;
  userId: number;
  userFullName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}

// Order & Pricing
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  productId: number;
  sellerId: number;
  sku: string;
  productName: string;
  unitPriceAmount: number;
  priceCurrency: string;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: number;
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

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
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

// Saved delivery addresses ("address book") — backend module: /api/addresses
export interface Address {
  id: number;
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = CreateAddressRequest;

// Payment method — presentational only today (backend uses a single simulated
// processor for every order); kept as its own type so a real gateway integration
// can be wired in later without reshaping the checkout UI.
export type PaymentMethod = 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'COD';
