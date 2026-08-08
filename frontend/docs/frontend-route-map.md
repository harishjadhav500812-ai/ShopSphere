# ShopSphere Frontend Route Architecture & Role Map

This document defines all application frontend routes, navigation hierarchy, layout wrappers, and role-based access guards (`CUSTOMER`, `SELLER`, `ADMIN`).

---

## 1. Public Routes (Unauthenticated & Authenticated)

| Route Path | Page Component | Allowed Roles | Description |
| ---------- | -------------- | ------------- | ----------- |
| `/` | `HomePage` | All (Public) | Hero section, featured categories, trending products banner |
| `/products` | `ProductListPage` | All (Public) | Search, filter by category, pagination, product cards |
| `/products/:id` | `ProductDetailPage` | All (Public) | Product image, price, stock indicator, seller info, add-to-cart |
| `/login` | `LoginPage` | Public (Unauthenticated) | Email/password login form -> acquires JWT token |
| `/register` | `RegisterPage` | Public (Unauthenticated) | Account creation form (Role selection: CUSTOMER / SELLER) |

---

## 2. Customer Protected Routes (`CUSTOMER` Role)

| Route Path | Page Component | Access Guard | Description |
| ---------- | -------------- | ------------ | ----------- |
| `/cart` | `CartPage` | `RoleGuard(CUSTOMER)` | Active cart items, quantity controls, price breakdown, checkout button |
| `/checkout` | `CheckoutPage` | `RoleGuard(CUSTOMER)` | Shipping address form, coupon code application, place order |
| `/checkout/payment/:orderId` | `PaymentPage` | `RoleGuard(CUSTOMER)` | Simulated payment confirmation interface |
| `/orders` | `CustomerOrdersPage` | `RoleGuard(CUSTOMER)` | List of customer orders with OrderStatus badges |
| `/orders/:id` | `OrderDetailPage` | `RoleGuard(CUSTOMER)` | Detailed order view, items breakdown, payment status, cancel action |
| `/orders/:id/tracking` | `OrderTrackingPage` | `RoleGuard(CUSTOMER)` | Live tracking timeline stepper with tracking number |
| `/profile` | `UserProfilePage` | `ProtectedRoute` | Authenticated user profile information and role display |

---

## 3. Seller Protected Routes (`SELLER` Role)

| Route Path | Page Component | Access Guard | Description |
| ---------- | -------------- | ------------ | ----------- |
| `/seller` | `SellerDashboardPage` | `RoleGuard(SELLER)` | Vendor overview, total products, vendor order statistics |
| `/seller/products` | `SellerProductsPage` | `RoleGuard(SELLER)` | Seller catalog table with quick edit / delete actions |
| `/seller/products/new` | `CreateProductPage` | `RoleGuard(SELLER)` | New product creation form (name, price, stock, category) |
| `/seller/products/:id/edit` | `EditProductPage` | `RoleGuard(SELLER)` | Update product form |
| `/seller/orders` | `SellerOrdersPage` | `RoleGuard(SELLER)` | Orders containing seller's items |
| `/seller/orders/:id` | `SellerOrderDetailPage` | `RoleGuard(SELLER)` | Detailed view of vendor order items |

---

## 4. Admin Protected Routes (`ADMIN` Role)

| Route Path | Page Component | Access Guard | Description |
| ---------- | -------------- | ------------ | ----------- |
| `/admin` | `AdminDashboardPage` | `RoleGuard(ADMIN)` | Platform analytics summary (orders, payments, inventory, coupons) |
| `/admin/categories` | `AdminCategoriesPage` | `RoleGuard(ADMIN)` | Category CRUD management table & modal forms |
| `/admin/orders` | `AdminOrdersPage` | `RoleGuard(ADMIN)` | All system orders with status management controls |
| `/admin/orders/:id` | `AdminOrderDetailPage` | `RoleGuard(ADMIN)` | Detailed order inspection & `OrderStatus` patch controls |
| `/admin/coupons` | `AdminCouponsPage` | `RoleGuard(ADMIN)` | Coupon CRUD table (discount percentage/fixed, usage limits) |
| `/admin/shipping` | `AdminShippingPage` | `RoleGuard(ADMIN)` | Shipment status management (`CREATED` -> `DELIVERED`) |

---

## 5. Fallback & System Routes

| Route Path | Page Component | Allowed Roles | Description |
| ---------- | -------------- | ------------- | ----------- |
| `/unauthorized` | `ForbiddenPage` | All | Shown when user lacks required role permissions (403) |
| `*` | `NotFoundPage` | All | Shown for invalid routes (404) |
