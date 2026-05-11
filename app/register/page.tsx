'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const departments = [
  'Computer Science and Engineering',
  'Electrical and Electronic Engineering',
  'Business Administration',
  'Economics', 'English', 'Media and Communication',
  'Law', 'Pharmacy', 'Life Sciences', 'Physical Sciences', 'Social Sciences',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ student_id: '', name: '', email: '', department: '', password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    if (!form.student_id || !form.name || !form.department || !form.password) { setError('Please fill in all required fields.'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setSuccess('Account created! Redirecting to login…'); setTimeout(() => router.push('/login'), 1800); }
      else setError(data.error);
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', border: '1px solid #b0c4cb', borderRadius: 4, padding: '11px 14px',
    fontSize: 14, color: '#333', outline: 'none', background: '#fff',
    boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#5ba4b4';
    e.target.style.boxShadow = '0 0 0 3px rgba(91,164,180,0.18)';
  };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#b0c4cb';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5', fontFamily: '"Segoe UI", Arial, sans-serif' }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#3c8dbc', minHeight: 68, display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 54, minWidth: 54, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
            <img src="/iub-logo.png" alt="IUB" style={{ height: 42, width: 'auto', objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>Independent University,</div>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>Bangladesh</div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: 480 }}>
          <div style={{ padding: '34px 36px 30px' }}>

            <h2 style={{ fontSize: 22, fontWeight: 400, color: '#333', margin: '0 0 6px' }}>Create your account</h2>
            <p style={{ fontSize: 13, color: '#777', margin: '0 0 24px' }}>Register to save and track your CGPA progress.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Student ID <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={inp} placeholder="e.g. 2321165" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={inp} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Email <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
              <input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Department <span style={{ color: '#dc2626' }}>*</span></label>
              <select style={{ ...inp, background: '#fff' } as React.CSSProperties} value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} onFocus={focus} onBlur={blur}>
                <option value="">Select your department…</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 6 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Password <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={inp} type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Confirm Password <span style={{ color: '#dc2626' }}>*</span></label>
                <input style={inp} type="password" placeholder="Repeat password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleRegister()} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 4, fontSize: 13, marginTop: 10 }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: 4, fontSize: 13, marginTop: 10 }}>✓ {success}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={handleRegister} disabled={loading}
                style={{ background: loading ? '#8bbec9' : '#5ba4b4', border: 'none', color: '#fff', padding: '9px 26px', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
                {loading ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Creating…</> : <>Create Account ⊞</>}
              </button>
            </div>

            <div style={{ borderTop: '1px solid #eee', margin: '20px 0 16px' }} />

            <button onClick={() => router.push('/login')}
              style={{ background: '#f8f9fa', border: '1px solid #d1d5db', color: '#374151', padding: '10px 16px', borderRadius: 4, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 8 }}>
              ← Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} input::placeholder{color:#aaa} select{appearance:auto} button:hover:not(:disabled){opacity:0.88}`}</style>
    </div>
  );
}
