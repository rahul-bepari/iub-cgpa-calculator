'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (u) setUser(JSON.parse(u));
  }, [router]);

  const handleChange = async () => {
    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError('Please fill in all fields.'); return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.'); return;
    }
    if (form.new_password.length < 6) {
      setError('New password must be at least 6 characters.'); return;
    }
    if (form.current_password === form.new_password) {
      setError('New password must be different from current password.'); return;
    }

    setLoading(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Password changed successfully!');
        setForm({ current_password: '', new_password: '', confirm_password: '' });
      } else setError(data.error);
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    flex: 1, border: '1.5px solid #d2d2d7', borderRadius: 10,
    padding: '12px 14px', fontSize: 15, outline: 'none',
    background: '#fff', color: '#1d1d1f', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif' }}>

      {/* NAV */}
      <nav style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.07)', position: 'sticky', top: 0, zIndex: 50, height: 56 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/iub-logo.png" alt="IUB" style={{ height: 34, width: 'auto', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ width: 1, height: 20, background: '#d2d2d7', margin: '0 2px' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>CGPA Calculator</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')}
              style={{ background: '#f5f5f7', border: '1px solid #e5e5ea', color: '#1d1d1f', padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Dashboard
            </button>
            <button onClick={() => { localStorage.clear(); router.push('/'); }}
              style={{ background: 'none', border: '1px solid #d2d2d7', color: '#1d1d1f', padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>

        {/* Profile Card */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '24px 28px', marginBottom: 16, border: '1px solid #e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1d1d1f', margin: '0 0 4px', letterSpacing: -0.4 }}>{user?.name || 'Student'}</h2>
              <p style={{ color: '#6e6e73', fontSize: 13, margin: 0 }}>Student ID: {user?.student_id} · {user?.department}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f5f5f7' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1d1d1f', margin: '0 0 4px', letterSpacing: -0.4 }}>Change Password</h3>
            <p style={{ color: '#6e6e73', fontSize: 14, margin: 0 }}>Choose a strong password you haven't used before.</p>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Current Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Current Password
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={form.current_password}
                    onChange={e => setForm({ ...form, current_password: e.target.value })}
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#0f172a'}
                    onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                  />
                  <button onClick={() => setShowCurrent(!showCurrent)}
                    style={{ background: '#f5f5f7', border: '1.5px solid #e5e5ea', borderRadius: 10, padding: '0 14px', cursor: 'pointer', fontSize: 16, color: '#6e6e73', fontFamily: 'inherit' }}>
                    {showCurrent ? '🙈' : '👀'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  New Password
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.new_password}
                    onChange={e => setForm({ ...form, new_password: e.target.value })}
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#0f172a'}
                    onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                  />
                  <button onClick={() => setShowNew(!showNew)}
                    style={{ background: '#f5f5f7', border: '1.5px solid #e5e5ea', borderRadius: 10, padding: '0 14px', cursor: 'pointer', fontSize: 16, color: '#6e6e73', fontFamily: 'inherit' }}>
                    {showNew ? '🙈' : '👀'}
                  </button>
                </div>

                {/* Password strength */}
                {form.new_password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => {
                        const strength = form.new_password.length >= 12 ? 4 : form.new_password.length >= 8 ? 3 : form.new_password.length >= 6 ? 2 : 1;
                        const color = strength >= 3 ? '#15803d' : strength >= 2 ? '#d97706' : '#dc2626';
                        return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? color : '#e5e5ea', transition: 'background 0.2s' }} />;
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: '#6e6e73', margin: 0 }}>
                      {form.new_password.length < 6 ? '❌ Too short' : form.new_password.length < 8 ? '⚠️ Weak' : form.new_password.length < 12 ? '✅ Good' : '💪 Strong'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6e6e73', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Confirm New Password
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleChange()}
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#0f172a'}
                    onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                  />
                  <button onClick={() => setShowConfirm(!showConfirm)}
                    style={{ background: '#f5f5f7', border: '1.5px solid #e5e5ea', borderRadius: 10, padding: '0 14px', cursor: 'pointer', fontSize: 16, color: '#6e6e73', fontFamily: 'inherit' }}>
                    {showConfirm ? '🙈' : '👀'}
                  </button>
                </div>
                {form.confirm_password && form.new_password !== form.confirm_password && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: '6px 0 0' }}>⚠️ Passwords do not match</p>
                )}
                {form.confirm_password && form.new_password === form.confirm_password && form.new_password.length >= 6 && (
                  <p style={{ fontSize: 12, color: '#15803d', margin: '6px 0 0' }}>✓ Passwords match</p>
                )}
              </div>

              {/* Error / Success */}
              {error && (
                <div style={{ background: '#fff2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 10, fontSize: 14 }}>
                  ✓ {success}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleChange}
                disabled={loading}
                style={{ background: '#0f172a', border: 'none', color: '#fff', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 4 }}>
                {loading ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Updating password…</>
                ) : 'Update Password →'}
              </button>
            </div>
          </div>
        </div>

        {/* Security tips */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', marginTop: 14, border: '1px solid #e5e5ea' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d1d1f', margin: '0 0 10px' }}>🔒 Password tips</h4>
          <ul style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {['Use at least 8 characters for a stronger password', 'Mix uppercase, lowercase, numbers and symbols', 'Never reuse passwords from other websites', 'Don\'t share your password with anyone'].map((tip, i) => (
              <li key={i} style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} button:hover:not(:disabled){opacity:0.82}`}</style>
    </div>
  );
}