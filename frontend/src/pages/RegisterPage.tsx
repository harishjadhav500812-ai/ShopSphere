import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import type { UserRole } from '../types';
import { ShoppingBag, Eye, EyeOff, User, Store, CheckCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) { setErrorMessage('Please fill in all fields.'); return; }
    if (password.length < 8 || password.length > 72) { setErrorMessage('Password must be between 8 and 72 characters.'); return; }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await register({ fullName, email, password, role });
      if (result.verificationRequired) {
        // Hand the user straight over to the email verification step
        navigate('/verify-email', {
          replace: true,
          state: { email: result.user.email, devCode: result.devVerificationCode ?? null },
        });
        return;
      }
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Please try a different email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #134e4a)', padding: '2rem 2rem 1.75rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 12px rgba(13,148,136,0.4)' }}>
              <ShoppingBag size={26} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Join ShopSphere</h1>
            <p style={{ fontSize: '0.875rem', color: '#99f6e4', marginTop: '0.375rem' }}>Create your free account in seconds</p>
          </div>

          <div style={{ padding: '1.75rem 2rem' }}>

            {/* Account type selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.625rem' }}>I want to</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { value: 'CUSTOMER', icon: User, label: 'Shop Products', sub: 'Buy from merchants' },
                  { value: 'SELLER', icon: Store, label: 'Sell Products', sub: 'Open a store' },
                ].map(opt => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value as UserRole)}
                      style={{ background: active ? '#f0fdfa' : '#fff', border: `2px solid ${active ? '#0d9488' : '#e5e7eb'}`, borderRadius: '10px', padding: '0.875rem 0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 180ms', fontFamily: 'inherit', position: 'relative' }}
                    >
                      {active && <CheckCircle size={15} style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', color: '#0d9488' }} />}
                      <Icon size={20} color={active ? '#0d9488' : '#6b7280'} strokeWidth={1.8} />
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: active ? '#0d9488' : '#374151', marginTop: '0.375rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{opt.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                <strong>!</strong> {errorMessage}
              </div>
            )}

            {successMessage && (
              <div style={{ background: '#f0fdfa', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Full Name</label>
                <input type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} required className="input-field" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Email Address</label>
                <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" style={{ paddingRight: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} style={{ width: '100%', marginTop: '0.25rem' }}>
                {isLoading ? 'Creating Account...' : 'Create Free Account'}
              </Button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Already a member?{' '}
              <Link to="/login" style={{ color: '#0d9488', fontWeight: 700 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#0f766e')}
                onMouseLeave={e => (e.currentTarget.style.color = '#0d9488')}>
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
