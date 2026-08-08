import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './components/auth/RoleGuard';
import { Layout } from './components/layout/Layout';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';

const CustomerOrdersPlaceholder = () => (
  <Card title="My Orders" subtitle="Track and manage your purchases">
    <p style={{ color: '#64748b' }}>Order history list connected to orderApi service.</p>
  </Card>
);

const SellerDashboardPlaceholder = () => (
  <Card title="Seller Workspace" subtitle="Manage your products and vendor orders">
    <p style={{ color: '#64748b' }}>Vendor stats and product management view.</p>
  </Card>
);

const AdminDashboardPlaceholder = () => (
  <Card title="Admin Workspace" subtitle="Platform administration and analytics">
    <p style={{ color: '#64748b' }}>System management view (Categories, Orders, Coupons, Shipping).</p>
  </Card>
);

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
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<Forbidden />} />

            {/* Customer Protected Routes */}
            <Route
              path="/orders"
              element={
                <RoleGuard allowedRoles="CUSTOMER">
                  <CustomerOrdersPlaceholder />
                </RoleGuard>
              }
            />

            {/* Seller Protected Routes */}
            <Route
              path="/seller"
              element={
                <RoleGuard allowedRoles="SELLER">
                  <SellerDashboardPlaceholder />
                </RoleGuard>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles="ADMIN">
                  <AdminDashboardPlaceholder />
                </RoleGuard>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
