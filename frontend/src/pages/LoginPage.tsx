import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ShoppingBag, Eye, EyeOff, User, Store, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMessage('Please enter your email and password.'); return; }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Incorrect email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => { setEmail(demoEmail); setPassword('password123'); setErrorMessage(''); };

  const demoAccounts = [
    { icon: User,   label: 'Customer', email: 'customer@shopsphere.test', color: '#0d9488' },
    { icon: Store,  label: 'Seller',   email: 'seller@shopsphere.test',   color: '#9333ea' },
    { icon: Shield, label: 'Admin',    email: 'admin@shopsphere.test',    color: '#dc2626' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Card */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Header strip */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #134e4a)', padding: '2rem 2rem 1.75rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 12px rgba(13,148,136,0.4)' }}>
              <ShoppingBag size={26} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Welcome Back</h1>
            <p style={{ fontSize: '0.875rem', color: '#99f6e4', marginTop: '0.375rem' }}>Sign in to your ShopSphere account</p>
          </div>

          {/* Form */}
          <div style={{ padding: '1.75rem 2rem' }}>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>!</span> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="input-field"
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%', marginTop: '0.25rem' }}>
                {isLoading ? 'Signing In...' : 'Sign In to ShopSphere'}
              </Button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', textAlign: 'center' }}>
                Try a Demo Account
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {demoAccounts.map(d => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => fillDemo(d.email)}
                      style={{ flex: 1, background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.375rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: '#374151', transition: 'all 160ms', fontFamily: 'inherit' }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = d.color; el.style.background = `${d.color}0d`; el.style.color = d.color; }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = '#e5e7eb'; el.style.background = 'none'; el.style.color = '#374151'; }}
                    >
                      <Icon size={16} />
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              New to ShopSphere?{' '}
              <Link to="/register" style={{ color: '#0d9488', fontWeight: 700, transition: 'color 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0f766e')}
                onMouseLeave={e => (e.currentTarget.style.color = '#0d9488')}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
