import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialDevCode = searchParams.get('devCode') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialDevCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      setSuccessMessage(response.message);

      setTimeout(() => {
        navigate('/login?resetSuccess=true');
      }, 1800);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid code or password reset request. Please check details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Outer Card */}
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Premium Header Banner */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #134e4a)', padding: '2.25rem 2rem 1.75rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 12px rgba(13,148,136,0.4)' }}>
              <Lock size={26} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Reset Your Password
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#99f6e4', marginTop: '0.375rem', lineHeight: 1.5 }}>
              Enter the 6-digit verification code sent to your email and set your new password.
            </p>
          </div>

          {/* Form Body */}
          <div style={{ padding: '1.75rem 2rem' }}>

            {initialDevCode && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2, color: '#d97706' }} />
                <div>
                  <span style={{ fontWeight: 700 }}>Dev Mode Code: </span>
                  <code style={{ background: '#fef3c7', padding: '0.125rem 0.375rem', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, color: '#b45309' }}>{initialDevCode}</code>
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div style={{ background: '#f0fdfa', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2, color: '#059669' }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{successMessage}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>Redirecting to sign in...</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Mail size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  6-Digit Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={10}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em', color: '#0d9488' }}
                  />
                  <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <KeyRound size={18} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Lock size={18} />
                  </div>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <Lock size={18} />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isLoading ? 'Updating Password...' : 'Set New Password'}
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <Link
                to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}
              >
                <ArrowLeft size={16} /> Return to Sign In
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
