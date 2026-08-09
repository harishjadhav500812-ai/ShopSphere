import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { ShoppingBag, MailCheck, RefreshCw, CheckCircle, TerminalSquare } from 'lucide-react';

interface VerifyEmailLocationState {
  email?: string;
  devCode?: string | null;
}

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const state = (location.state as VerifyEmailLocationState) ?? {};
  const initialEmail = state.email || searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(state.devCode ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const codeComplete = useMemo(() => /^\d{6}$/.test(code), [code]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setErrorMessage('Please enter your email address.'); return; }
    if (!codeComplete) { setErrorMessage('Please enter the 6-digit verification code.'); return; }
    setIsLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      await authApi.verifyEmail({ email, code });
      navigate('/login', { replace: true, state: { verified: true, email } });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { setErrorMessage('Please enter your email address first.'); return; }
    setIsResending(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      const result = await authApi.resendVerification(email);
      if (result.devVerificationCode) {
        setDevCode(result.devVerificationCode);
        setInfoMessage('A new verification code was generated for your account.');
      } else {
        setInfoMessage(`A new verification code was sent to ${result.email}.`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not resend the code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.07)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #134e4a)', padding: '2rem 2rem 1.75rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #0d9488, #0f766e)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 4px 12px rgba(13,148,136,0.4)' }}>
              <MailCheck size={26} color="#fff" strokeWidth={2} />
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>Verify Your Email</h1>
            <p style={{ fontSize: '0.875rem', color: '#99f6e4', marginTop: '0.375rem' }}>
              Enter the 6-digit code to activate your account
            </p>
          </div>

          <div style={{ padding: '1.75rem 2rem' }}>

            <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#134e4a', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              A verification code was sent to <strong>{email || 'your email address'}</strong>.
              The code expires after 10 minutes.
            </div>

            {devCode && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#92400e', marginBottom: '1.25rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start', lineHeight: 1.5 }}>
                <TerminalSquare size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong>Dev mode:</strong> no email server (MAIL_HOST) is configured, so use this code instead:
                  <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.35em', marginTop: '0.375rem' }}>{devCode}</div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 700, flexShrink: 0 }}>!</span> {errorMessage}
              </div>
            )}

            {infoMessage && (
              <div style={{ background: '#f0fdfa', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> {infoMessage}
              </div>
            )}

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Email Address</label>
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
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="input-field"
                  style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '0.5em', fontWeight: 700 }}
                />
              </div>

              <Button type="submit" variant="primary" size="lg" isLoading={isLoading} disabled={!codeComplete} style={{ width: '100%', marginTop: '0.25rem' }}>
                {isLoading ? 'Verifying...' : 'Verify & Activate Account'}
              </Button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                style={{ background: 'none', border: 'none', color: '#0d9488', fontWeight: 700, cursor: isResending ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: 0, fontFamily: 'inherit', fontSize: '0.875rem' }}
              >
                <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                {isResending ? 'Resending...' : 'Resend code'}
              </button>
              <Link to="/login" style={{ color: '#6b7280', fontWeight: 600 }}>Back to Sign In</Link>
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: '#9ca3af' }}>
              <ShoppingBag size={12} style={{ display: 'inline-block', verticalAlign: '-2px', marginRight: '0.25rem' }} />
              Need help? Contact support@shopsphere.local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
