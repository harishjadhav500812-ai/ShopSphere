# ShopSphere Frontend to Backend Feature & API Contract Map

This document maps every backend capability, REST endpoint, role restriction, and state transition to its corresponding frontend screen, user action, and state representation.

---

## 1. Authentication & User Management

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| Register User | `POST /api/users/register` | Public | `/register` | Form submit (email, password, fullName, role) | Success toast -> redirect to Login |
| Login / Acquire JWT | `POST /api/auth/login` | Public | `/login` | Form submit (email, password) | Stores JWT in localStorage, updates AuthState |
| Get Current Profile | `GET /api/users/me` | Customer / Seller / Admin | Header / `/profile` | Automatic on app mount / token load | Displays user name, email, role badge |
| Health Check | `GET /api/health` | Public | Background | System status ping | Connected / Offline badge |

---

## 2. Category Management

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| List Categories | `GET /api/categories` | Public | Catalog / Admin Categories | Page load / filter dropdown | Render category tree / pills |
| Get Category | `GET /api/categories/{id}` | Public | Product Catalog | Select category filter | Filtered product grid |
| Create Category | `POST /api/categories` | Admin | `/admin/categories` | "Add Category" Modal submit | Category list refresh |
| Update Category | `PUT /api/categories/{id}` | Admin | `/admin/categories` | "Edit Category" Modal submit | Category updated state |
| Delete Category | `DELETE /api/categories/{id}` | Admin | `/admin/categories` | Confirm delete dialog | Category removed state |

---

## 3. Product Catalog & Inventory

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| Browse Products | `GET /api/products` | Public | `/products` | Search bar, category filter, pagination | Product Grid, Page state |
| Get Product Detail | `GET /api/products/{id}` | Public | `/products/{id}` | Click product card | Product Detail View, Stock indicator |
| Create Product | `POST /api/products` | Seller | `/seller/products/new` | Product creation form submit | Product added -> redirect to seller list |
| Update Product | `PUT /api/products/{id}` | Seller | `/seller/products/{id}/edit` | Product edit form submit | Product updated state |
| Delete Product | `DELETE /api/products/{id}` | Seller | `/seller/products` | Confirm delete modal | Product removed state |

---

## 4. Shopping Cart

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| View Cart | `GET /api/cart` | Customer | `/cart` | Header cart icon click | Cart item list, subtotal calculation |
| Add Item to Cart | `POST /api/cart/items` | Customer | `/products/{id}` | "Add to Cart" button click | Badge counter update, Success toast |
| Update Item Quantity | `PUT /api/cart/items/{itemId}` | Customer | `/cart` | `+` / `-` quantity controls | Instant subtotal recalculation |
| Remove Cart Item | `DELETE /api/cart/items/{itemId}` | Customer | `/cart` | Remove item button click | Item row removed, subtotal updated |
| Clear Cart | `DELETE /api/cart` | Customer | `/cart` | "Clear Cart" button click | Empty cart state |

---

## 5. Order Foundation & Checkout

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| Checkout / Create Order | `POST /api/orders` | Customer | `/checkout` | "Place Order" (optional couponCode) | Status: `PENDING` -> Order Created |
| List Customer Orders | `GET /api/orders` | Customer | `/orders` | Page load | Order history list, `OrderStatus` badges |
| Get Order Details | `GET /api/orders/{id}` | Customer | `/orders/{id}` | Click order card | Line items, pricing breakdown, status stepper |
| Cancel Order | `POST /api/orders/{id}/cancel` | Customer | `/orders/{id}` | "Cancel Order" button click | Status -> `CANCELLED`, inventory restored |
| Seller Orders View | `GET /api/seller/orders` | Seller | `/seller/orders` | Page load | Multi-vendor order list filtered by seller |
| Seller Order Details | `GET /api/seller/orders/{id}` | Seller | `/seller/orders/{id}` | Click seller order card | Vendor-specific items view |
| Admin Orders View | `GET /api/admin/orders` | Admin | `/admin/orders` | Page load | All system orders with status filters |
| Admin Order Details | `GET /api/admin/orders/{id}` | Admin | `/admin/orders/{id}` | Click admin order card | Full order inspection |
| Admin Update Order Status | `PATCH /api/admin/orders/{id}/status` | Admin | `/admin/orders/{id}` | Change status dropdown | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |

---

## 6. Payment (Simulated Provider)

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| Simulate Payment | `POST /api/orders/{id}/payment/simulate` | Customer | `/checkout/payment/{id}` | "Pay Now" simulated button click | `PaymentStatus`: `PENDING` -> `SUCCESS`, `OrderStatus` -> `CONFIRMED` |
| View Payment Info | `GET /api/orders/{id}/payment` | Customer | `/orders/{id}` | View Payment tab | Payment method, transaction ID, status |

---

## 7. Coupons & Pricing Breakdown

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| List Admin Coupons | `GET /api/admin/coupons` | Admin | `/admin/coupons` | Page load | Coupon list table |
| Create Coupon | `POST /api/admin/coupons` | Admin | `/admin/coupons` | "Create Coupon" Modal submit | Coupon added state |
| Get Coupon Detail | `GET /api/admin/coupons/{id}` | Admin | `/admin/coupons/{id}` | Click coupon row | Detail modal/view |
| Update Coupon | `PATCH /api/admin/coupons/{id}` | Admin | `/admin/coupons/{id}` | Toggle active / update form | Coupon updated state |
| Delete Coupon | `DELETE /api/admin/coupons/{id}` | Admin | `/admin/coupons` | Confirm delete dialog | Coupon deleted state |
| Apply Coupon at Checkout | `POST /api/orders` (`couponCode`) | Customer | `/checkout` | Enter coupon code input | Server validates subtotal, discount, tax, total |

---

## 8. Shipping & Tracking

| Backend Feature | Endpoint | Role | Frontend Screen | UI Action | State/Status |
| --------------- | -------- | ---- | --------------- | --------- | ------------ |
| Create Shipment | `POST /api/orders/{id}/shipment` | Customer | `/checkout` / `/orders/{id}` | Fill address snapshot form | `ShippingStatus`: `CREATED` / `READY_TO_SHIP` |
| Get Customer Shipment | `GET /api/orders/{id}/shipment` | Customer | `/orders/{id}/shipping` | Click "Shipping Details" | Address snapshot, status badge |
| Track Shipment | `GET /api/orders/{id}/tracking` | Customer | `/orders/{id}/tracking` | Click "Track Order" | Live tracking timeline stepper (`SIM-TRACK-<UUID>`) |
| Admin Update Shipment Status | `PATCH /api/admin/orders/{id}/shipment-status` | Admin | `/admin/orders/{id}` | Update shipment status dropdown | `CREATED` -> `READY_TO_SHIP` -> `SHIPPED` -> `IN_TRANSIT` -> `OUT_FOR_DELIVERY` -> `DELIVERED` |
