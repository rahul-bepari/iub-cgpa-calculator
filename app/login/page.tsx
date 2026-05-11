'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ student_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!form.student_id || !form.password) { setError('Please enter your ID and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else { setError(data.error); }
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f2f5',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }}>

      {/* ── HEADER exactly like IUB portal ── */}
      <header style={{
        background: '#3c8dbc',
        padding: '0',
        display: 'flex',
        alignItems: 'center',
        minHeight: 68,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        <div style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>

          {/* Real IUB Logo */}
          <img
            src="/iub-logo.png"
            alt="IUB Logo"
            style={{
              height: 52,
              width: 'auto',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />

          {/* University name */}
          <div>
            <div style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.25,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              Independent University,
            </div>
            <div style={{
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              lineHeight: 1.25,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}>
              Bangladesh
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
      }}>

        {/* Floating card — exactly like IUB portal */}
        <div style={{
          background: '#fff',
          borderRadius: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        }}>

          {/* Card content */}
          <div style={{ padding: '36px 36px 32px' }}>

            <h2 style={{
              fontSize: 22,
              fontWeight: 400,
              color: '#333',
              margin: '0 0 6px',
              letterSpacing: -0.3,
            }}>
              Sign in to your account
            </h2>
            <p style={{
              fontSize: 13,
              color: '#777',
              margin: '0 0 28px',
            }}>
              Please enter your Id and password to log in.
            </p>

            {/* Student ID field */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="text"
                placeholder="User Id"
                value={form.student_id}
                onChange={e => setForm({ ...form, student_id: e.target.value })}
                style={{
                  width: '100%',
                  border: '1px solid #b0c4cb',
                  borderRadius: 4,
                  padding: '11px 14px',
                  fontSize: 14,
                  color: '#333',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box' as const,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#5ba4b4';
                  e.target.style.boxShadow = '0 0 0 3px rgba(91,164,180,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#b0c4cb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 6, position: 'relative' }}>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%',
                  border: '1px solid #b0c4cb',
                  borderRadius: 4,
                  padding: '11px 14px',
                  paddingRight: 140,
                  fontSize: 14,
                  color: '#333',
                  outline: 'none',
                  background: '#fff',
                  boxSizing: 'border-box' as const,
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#5ba4b4';
                  e.target.style.boxShadow = '0 0 0 3px rgba(91,164,180,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#b0c4cb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <span style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: '#5ba4b4',
                cursor: 'pointer',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>
                
              </span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: 4,
                fontSize: 13,
                marginTop: 12,
              }}>
                {error}
              </div>
            )}

            {/* Login button — bottom right like IUB */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 24,
            }}>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  background: loading ? '#8bbec9' : '#5ba4b4',
                  border: 'none',
                  color: '#fff',
                  padding: '9px 24px',
                  borderRadius: 4,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'inherit',
                  letterSpacing: 0.3,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 3,
                      width: 20,
                      height: 20,
                      fontSize: 13,
                    }}></span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{
              borderTop: '1px solid #eee',
              margin: '24px 0 20px',
            }} />

            {/* Extra links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  padding: '10px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left' as const,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15 }}></span>
                Continue without login (Guest mode)
              </button>
              <button
                onClick={() => router.push('/register')}
                style={{
                  background: '#fff',
                  border: '1px solid #5ba4b4',
                  color: '#569099',
                  padding: '10px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left' as const,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15 }}></span>
                Create new account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #aaa; }
        button { transition: opacity 0.15s; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>
    </div>
  );
}