import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
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

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.forgotPassword(email.trim());
      setSuccessMessage(response.message);

      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email.trim())}${response.devResetCode ? `&devCode=${response.devResetCode}` : ''}`);
      }, 1400);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not process password reset request. Please check your email address.');
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
              <KeyRound size={26} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Forgot Password?
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#99f6e4', marginTop: '0.375rem', lineHeight: 1.5 }}>
              No worries! Enter your registered email and we'll send you a 6-digit verification code to reset your password.
            </p>
          </div>

          {/* Form Body */}
          <div style={{ padding: '1.75rem 2rem' }}>

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
                  <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>Redirecting to code verification page...</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                {isLoading ? 'Sending Reset Code...' : 'Send Verification Code'}
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <Link
                to="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600, color: '#64748b', textDecoration: 'none', transition: 'color 0.15s ease' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
              <Link
                to="/register"
                style={{ fontWeight: 700, color: '#0d9488', textDecoration: 'none' }}
              >
                Create Account
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
