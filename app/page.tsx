'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a valid PDF file.'); return; }
    setUploading(true); setError('');
    const fd = new FormData(); fd.append('transcript', file);
    try {
      const res = await fetch('/api/transcript', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { sessionStorage.setItem('transcriptData', JSON.stringify(data)); router.push('/dashboard?guest=true'); }
      else setError(data.error || 'Could not read transcript.');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif', color: '#1d1d1f' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: '#edf1ff', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)', height: 56 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/iub-logo.png" alt="IUB" style={{ height: 38, width: 'auto', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ width: 1, height: 24, background: '#d2d2d7', margin: '0 4px' }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1d1d1f', letterSpacing: -0.3 }}>CGPA Calculator</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', color: '#1d1d1f', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '7px 16px', borderRadius: 8 }}>
              Sign in
            </button>
            <button onClick={() => router.push('/register')} style={{ background: '#0f172a', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 18px', borderRadius: 20 }}>
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, padding: '130px 24px 80px', textAlign: 'center' }}>

        {/* IUB Logo big */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ background: '#f5f5f7', borderRadius: 20, padding: '14px 24px', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            <img src="/iub-logo.png" alt="IUB Logo" style={{ height: 48, width: 'auto', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f', lineHeight: 1.2 }}>Independent University</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f', lineHeight: 1.2 }}>Bangladesh</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <div style={{ width: 6, height: 6, background: '#34c759', borderRadius: '50%' }} />
                <span style={{ fontSize: 11, color: '#6e6e73' }}> CGPA Tool</span>
              </div>
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: 'clamp(38px, 7vw, 76px)', fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.04, margin: '0 auto 20px', maxWidth: 820, color: '#1d1d1f' }}>
          Your CGPA.<br />
          <span style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Understood instantly.
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#6e6e73', maxWidth: 500, margin: '0 auto 52px', lineHeight: 1.65, fontWeight: 400 }}>
          Upload your IUB transcript and get a complete breakdown of your academic performance in seconds.
        </p>

        {/* ── UPLOAD ZONE ── */}
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => document.getElementById('fi')?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : '#d2d2d7'}`,
              borderRadius: 20,
              padding: '44px 32px',
              cursor: 'pointer',
              background: dragOver ? '#eff6ff' : '#fafafa',
              transition: 'all 0.2s ease',
              marginBottom: 14,
            }}>
            <input id="fi" type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#1e3a8a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <p style={{ color: '#6e6e73', fontSize: 15, fontWeight: 500, margin: 0 }}>Reading your transcript…</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, background: '#eff6ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📄</div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 600, color: '#1d1d1f', margin: '0 0 5px' }}>Drop your transcript here</p>
                  <p style={{ fontSize: 14, color: '#86868b', margin: 0 }}>or click to browse — PDF only</p>
                </div>
                <div style={{ background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 30px', borderRadius: 20, marginTop: 4 }}>
                  Upload transcript
                </div>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fff2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, fontSize: 14, marginBottom: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <p style={{ fontSize: 12, color: '#aeaeb2', margin: '0 0 20px' }}>No account needed · Data never stored in guest mode</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
            <span style={{ fontSize: 13, color: '#aeaeb2' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e5e5ea' }} />
          </div>

          <button onClick={() => router.push('/register')} style={{ width: '100%', background: '#fff', border: '1.5px solid #d2d2d7', color: '#1d1d1f', fontSize: 15, fontWeight: 500, padding: '14px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Create a free account to save your data →
          </button>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', background: '#f5f5f7' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 46px)', fontWeight: 700, letterSpacing: -1.2, textAlign: 'center', marginBottom: 10, color: '#1d1d1f' }}>
            Everything you need.
          </h2>
          <p style={{ textAlign: 'center', color: '#6e6e73', fontSize: 17, marginBottom: 52, fontWeight: 400 }}>
            Built specifically for IUB students.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
            {[
              { icon: '⚡', title: 'Instant Results', desc: 'Upload and see your full CGPA breakdown in under 3 seconds.' },
              { icon: '🎯', title: 'Retake Advisor', desc: 'Find which courses to retake for the biggest CGPA boost.' },
              { icon: '➕', title: 'Future Planning', desc: 'Add upcoming courses and simulate your projected CGPA.' },
              { icon: '🧪', title: 'Theory + Lab Aware', desc: 'Automatically pairs theory and lab courses together, just like IUB.' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '26px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e5e5ea' }}>
                <div style={{ fontSize: 30, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 8, letterSpacing: -0.3 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6e6e73', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '28px 24px', borderTop: '1px solid #e5e5ea', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <img src="/iub-logo.png" alt="IUB" style={{ height: 28, opacity: 0.4 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <p style={{ fontSize: 12, color: '#aeaeb2', margin: 0 }}>
          © 2025 IUB CGPA Calculator · Made for Independent University, Bangladesh students
        </p>
      </footer>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} button:hover{opacity:0.85}`}</style>
    </div>
  );
}
