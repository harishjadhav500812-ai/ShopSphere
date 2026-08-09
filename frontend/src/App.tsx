import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './components/auth/RoleGuard';
import { Layout } from './components/layout/Layout';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentPage } from './pages/PaymentPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { SellerDashboardPage } from './pages/seller/SellerDashboardPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerProductFormPage } from './pages/seller/SellerProductFormPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerOrderDetailPage } from './pages/seller/SellerOrderDetailPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';

const Forbidden = () => (
  <Card title="403 — Access Forbidden" subtitle="Insufficient Role Permissions">
    <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
      Your authenticated user role does not have permission to access this page.
    </p>
    <Link to="/"><Button variant="secondary">Back to Home</Button></Link>
  </Card>
);

const NotFound = () => (
  <Card title="404 — Page Not Found">
    <p style={{ color: '#64748b', marginBottom: '1rem' }}>The page you are looking for does not exist.</p>
    <Link to="/"><Button variant="secondary">Back to Home</Button></Link>
  </Card>
);

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<CatalogPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/unauthorized" element={<Forbidden />} />

              {/* Customer Protected Routes */}
              <Route
                path="/checkout"
                element={
                  <RoleGuard allowedRoles="CUSTOMER">
                    <CheckoutPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/checkout/payment/:orderId"
                element={
                  <RoleGuard allowedRoles="CUSTOMER">
                    <PaymentPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/orders"
                element={
                  <RoleGuard allowedRoles="CUSTOMER">
                    <OrdersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <RoleGuard allowedRoles="CUSTOMER">
                    <OrderDetailPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <RoleGuard allowedRoles="CUSTOMER">
                    <WishlistPage />
                  </RoleGuard>
                }
              />

              {/* Seller Protected Routes */}
              <Route
                path="/seller"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/products"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerProductsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/products/new"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerProductFormPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/products/:id/edit"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerProductFormPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/orders"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerOrdersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/orders/:id"
                element={
                  <RoleGuard allowedRoles="SELLER">
                    <SellerOrderDetailPage />
                  </RoleGuard>
                }
              />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles="ADMIN">
                    <AdminDashboardPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <RoleGuard allowedRoles="ADMIN">
                    <AdminCategoriesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <RoleGuard allowedRoles="ADMIN">
                    <AdminOrdersPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/orders/:id"
                element={
                  <RoleGuard allowedRoles="ADMIN">
                    <AdminOrderDetailPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <RoleGuard allowedRoles="ADMIN">
                    <AdminCouponsPage />
                  </RoleGuard>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
