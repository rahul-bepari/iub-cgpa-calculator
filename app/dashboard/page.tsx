'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────
const GRADES = ['A','A-','B+','B','B-','C+','C','C-','D+','D','F'];
const GP: Record<string,number> = {
  'A':4.00,'A-':3.70,'B+':3.30,'B':3.00,'B-':2.70,
  'C+':2.30,'C':2.00,'C-':1.70,'D+':1.30,'D':1.00,'F':0.00
};
const LOW_GRADES = ['F','D','D+','C-','C','C+','B-','B'];

// ── Helpers ────────────────────────────────────────────────────────────────
function baseCode(code: string) { return code.endsWith('L') ? code.slice(0,-1) : code; }

function gradeChip(g: string) {
  if (['A','A-'].includes(g)) return { bg:'#dcfce7', color:'#15803d' };
  if (['B+','B','B-'].includes(g)) return { bg:'#dbeafe', color:'#1e40af' };
  if (['C+','C','C-'].includes(g)) return { bg:'#fef9c3', color:'#92400e' };
  if (['D+','D'].includes(g)) return { bg:'#ffedd5', color:'#c2410c' };
  if (g==='F') return { bg:'#fee2e2', color:'#dc2626' };
  return { bg:'#f3f4f6', color:'#6b7280' };
}

function calcCGPA(cs: any[]) {
  // IUB Rules:
  // W (Withdraw) → completely ignored, not counted at all
  // F (Fail) → counts as 0 grade points, credit attempted counted
  // Retake (R) → completely replaces the original entry
  // T (Transfer attempt fail) → ignored

  // Step 1: Group by course_code
  const grouped = new Map<string, any[]>();
  cs.forEach(c => {
    const key = c.course_code;
    const existing = grouped.get(key) || [];
    existing.push(c);
    grouped.set(key, existing);
  });

  let totalCreditEarned = 0;
  let totalGradePoints = 0;
  let totalAttempted = 0;

  grouped.forEach((entries) => {
    const retake = entries.find(e => e.course_type === 'retake');
    const transfer = entries.find(e => e.course_type === 'transfer');
    const regular = entries.find(e => e.course_type === 'regular' || e.course_type === 'new');

    if (retake) {
      // Retake exists — use ONLY retake, completely discard original
      // W entries for this course are ignored
      if (retake.grade === 'W') return; // withdrawn retake, skip
      totalCreditEarned += Number(retake.credit_earned);
      totalGradePoints += Number(retake.grade_point);
      totalAttempted += Number(retake.credit);
    } else if (regular) {
      // No retake — check grade
      if (regular.grade === 'W') return; // W = completely ignore
      if (regular.grade === 'F') {
        // F = counts in attempted, 0 earned, 0 grade points
        totalAttempted += Number(regular.credit);
        // credit_earned stays 0, grade_point stays 0
        return;
      }
      // Normal grade
      totalCreditEarned += Number(regular.credit_earned);
      totalGradePoints += Number(regular.grade_point);
      totalAttempted += Number(regular.credit);
    } else if (transfer) {
      // Transfer/T type — ignore completely
      return;
    }
  });

  return {
    cgpa: totalCreditEarned > 0
      ? Math.round(totalGradePoints / totalCreditEarned * 100) / 100
      : 0,
    earned: totalCreditEarned,
    pts: Math.round(totalGradePoints * 100) / 100,
    attempted: totalAttempted,
  };
}

function getPair(cs: any[], base: string) {
  return {
    theory: cs.find(c => c.course_code === base && Number(c.credit_earned)>0) || null,
    lab:    cs.find(c => c.course_code === base+'L' && Number(c.credit_earned)>0) || null,
  };
}

function getRecs(cs: any[]) {
  const { cgpa } = calcCGPA(cs);
  const seen = new Set<string>();
  const recs: any[] = [];

  cs.filter(c => (Number(c.credit_earned)>0 || c.grade==='F') && LOW_GRADES.includes(c.grade) && c.course_type!=='transfer')
    .forEach(c => {
      const base = baseCode(c.course_code);
      if (seen.has(base)) return;
      seen.add(base);

      const { theory, lab } = getPair(cs, base);

      // Simulate getting A for the entire pair
      const updated = cs.map(x => {
        if (baseCode(x.course_code)===base && Number(x.credit_earned)>0) {
          return { ...x, grade:'A', grade_point: 4.00 * Number(x.credit) };
        }
        return x;
      });
      const newCGPA = calcCGPA(updated).cgpa;
      const gain = Math.round((newCGPA - cgpa)*100)/100;

      // Worst grade among the pair
      const pairGrades = [theory?.grade, lab?.grade].filter(Boolean);
      const worstGrade = pairGrades.reduce((w,g) => (GP[g!]||0)<(GP[w]||0) ? g! : w, pairGrades[0]||'F');

      recs.push({ base, theory, lab, worstGrade, potential: newCGPA, gain });
    });

  return recs.sort((a,b) => b.gain - a.gain).slice(0,5);
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Sheet({ title, onClose, children }: { title:string, onClose:()=>void, children:React.ReactNode }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden', animation:'slideUp 0.22s ease' }}>
        <div style={{ padding:'18px 22px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:17, fontWeight:700, color:'#1d1d1f', margin:0, letterSpacing:-0.4 }}>{title}</h3>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:'50%', background:'#f5f5f7', border:'none', cursor:'pointer', fontSize:16, color:'#6e6e73', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

const F = (label:string, el:React.ReactNode) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#6e6e73', marginBottom:5, textTransform:'uppercase', letterSpacing:0.4 }}>{label}</label>
    {el}
  </div>
);

const inp: React.CSSProperties = {
  width:'100%', border:'1.5px solid #d2d2d7', borderRadius:8,
  padding:'10px 13px', fontSize:14, outline:'none',
  background:'#fff', color:'#1d1d1f', boxSizing:'border-box', fontFamily:'inherit'
};

// ── Main Dashboard ─────────────────────────────────────────────────────────
function DashContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const isGuest = sp.get('guest')==='true';

  const [courses, setCourses] = useState<any[]>([]);
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'courses'|'recs'>('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [retakeOpen, setRetakeOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [semFilter, setSemFilter] = useState('All');

  // Add course form
  const [nc, setNc] = useState({ code:'', title:'', grade:'A', credit:'3', sem:'', hasLab:false, labCredit:'1' });
  // Retake form
  const [rc, setRc] = useState({ base:'', grade:'A' });

  const toast$ = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3200); };

  const load = useCallback(() => {
    if (isGuest) {
      const d = sessionStorage.getItem('transcriptData');
      if (d) {
        const p = JSON.parse(d);
        setCourses(p.courses||[]);
        setInfo({ name:p.student_name, id:p.student_id, major:p.major });
      }
      setLoading(false);
    } else {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      const u = localStorage.getItem('user');
      if (u) setInfo(JSON.parse(u));
      fetch('/api/courses', { headers:{ Authorization:`Bearer ${token}` } })
        .then(r=>r.json())
        .then(d=>{ if(d.success) setCourses(d.courses); setLoading(false); });
    }
  }, [isGuest, router]);

  useEffect(()=>{ load(); },[load]);

  const uploadPDF = async (file:File) => {
    if (!file || file.type!=='application/pdf') { toast$('❌ PDF files only'); return; }
    setFileName(file.name); setUploading(true);
    const fd = new FormData(); fd.append('transcript', file);
    try {
      const r = await fetch('/api/transcript', { method:'POST', body:fd });
      const d = await r.json();
      if (d.success) {
        if (isGuest) {
          sessionStorage.setItem('transcriptData', JSON.stringify(d));
          setCourses(d.courses);
          setInfo({ name:d.student_name, id:d.student_id, major:d.major });
          toast$('✓ Transcript loaded');
        } else {
          const token = localStorage.getItem('token');
          await fetch('/api/courses', {
            method:'POST',
            headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
            body: JSON.stringify({ courses:d.courses, summary:{ cgpa:d.cgpa, total_credits_earned:d.total_credits_earned, total_credits_attempted:d.total_credits_attempted, total_grade_points:d.total_grade_points } })
          });
          setCourses(d.courses); toast$('✓ Transcript saved');
        }
      } else toast$('❌ '+d.error);
    } catch { toast$('❌ Upload failed'); }
    finally { setUploading(false); }
  };

  const addCourse = async () => {
    if (!nc.code||!nc.title||!nc.sem) { toast$('❌ Fill all fields'); return; }
    const cr = parseFloat(nc.credit);
    const g = (GP[nc.grade]||0)*cr;
    const ce = nc.grade==='F' ? 0 : cr;
    const theory = { course_code:nc.code.toUpperCase(), course_title:nc.title, grade:nc.grade, credit:cr, credit_earned:ce, grade_point:g, semester:nc.sem, course_type:'new' };

    const newCourses = [theory];

    // If has lab, add lab course too
    if (nc.hasLab) {
      const labCr = parseFloat(nc.labCredit);
      const labGP = (GP[nc.grade]||0)*labCr;
      const labCE = nc.grade==='F' ? 0 : labCr;
      const lab = { course_code:nc.code.toUpperCase()+'L', course_title:'Lab for '+nc.code.toUpperCase(), grade:nc.grade, credit:labCr, credit_earned:labCE, grade_point:labGP, semester:nc.sem, course_type:'new' };
      newCourses.push(lab);
    }

    if (!isGuest) {
      const token = localStorage.getItem('token');
      for (const c of newCourses) {
        await fetch('/api/courses', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify(c) });
      }
    }
    setCourses(p=>[...p,...newCourses]);
    setAddOpen(false);
    setNc({ code:'', title:'', grade:'A', credit:'3', sem:'', hasLab:false, labCredit:'1' });
    toast$(`✓ ${newCourses.length} course${newCourses.length>1?'s':''} added${nc.hasLab?' (theory + lab)':''}`);
  };

  const doRetake = async () => {
    if (!rc.base) { toast$('❌ Select a course'); return; }
    const { theory, lab } = getPair(courses, rc.base);
    if (!theory && !lab) { toast$('❌ Course not found'); return; }

    if (!isGuest) {
      const token = localStorage.getItem('token');
      if (theory) await fetch('/api/courses', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ course_code:rc.base, new_grade:rc.grade }) });
      if (lab)    await fetch('/api/courses', { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ course_code:rc.base+'L', new_grade:rc.grade }) });
    }

    setCourses(p => p.map(x => {
      if (baseCode(x.course_code)===rc.base && Number(x.credit_earned)>0) {
        return { ...x, grade:rc.grade, grade_point:(GP[rc.grade]||0)*Number(x.credit), course_type:'retake' };
      }
      return x;
    }));

    const count = (theory?1:0)+(lab?1:0);
    setRetakeOpen(false);
    toast$(`✓ Updated ${count} course${count>1?'s':''} (${theory?'theory':''}${lab?' + lab':''})`);
  };
  const deleteCourse = async (courseCode: string) => {
    if (!confirm(`Remove ${courseCode} from your course list?`)) return;
    
    if (!isGuest) {
      const token = localStorage.getItem('token');
      await fetch('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_code: courseCode }),
      });
    }
    
    setCourses(p => p.filter(x => x.course_code !== courseCode));
    toast$(`✓ ${courseCode} removed`);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTopColor:'#0f172a', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const { cgpa, earned, attempted } = calcCGPA(courses);
  const recs = getRecs(courses);
  const sems = ['All', ...Array.from(new Set(courses.map((c:any)=>c.semester))).filter(Boolean)] as string[];
  const filtered = courses.filter((c:any) =>
    (c.course_code.toLowerCase().includes(search.toLowerCase()) || c.course_title.toLowerCase().includes(search.toLowerCase())) &&
    (semFilter==='All' || c.semester===semFilter)
  );

  // Retake preview CGPA
  const retakePreview = rc.base ? (() => {
    const { theory } = getPair(courses, rc.base);
    if (!theory) return null;
    const u = courses.map(x => baseCode(x.course_code)===rc.base && Number(x.credit_earned)>0
      ? { ...x, grade:rc.grade, grade_point:(GP[rc.grade]||0)*Number(x.credit) } : x);
    return calcCGPA(u).cgpa;
  })() : null;

  // Add course preview CGPA
  const addPreview = nc.code ? (() => {
    const cr = parseFloat(nc.credit||'3');
    const labCr = nc.hasLab ? parseFloat(nc.labCredit||'1') : 0;
    const g = GP[nc.grade]||0;
    const preview = [...courses,
      { credit:cr, credit_earned:nc.grade==='F'?0:cr, grade_point:g*cr },
      ...(nc.hasLab ? [{ credit:labCr, credit_earned:nc.grade==='F'?0:labCr, grade_point:g*labCr }] : [])
    ];
    return calcCGPA(preview).cgpa;
  })() : null;

  // Unique base codes for retake dropdown
  const retakeOptions = (() => {
    const seen = new Set<string>();
    return courses.filter(c=>Number(c.credit_earned)>0).filter(c=>{
      const b = baseCode(c.course_code);
      if (seen.has(b)) return false;
      seen.add(b); return true;
    });
  })();

  const cgpaColor = cgpa>=3.5?'#15803d':cgpa>=3.0?'#1e40af':cgpa>=2.5?'#d97706':'#dc2626';
  const cgpaLabel = cgpa>=3.5?'Excellent':cgpa>=3.0?'Good':cgpa>=2.5?'Average':'Needs work';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f7', fontFamily:'-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif', color:'#1d1d1f' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:'#1d1d1f', color:'#fff', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:500, zIndex:9999, whiteSpace:'nowrap', boxShadow:'0 4px 20px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}

      {/* NAV */}
      <nav style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'saturate(180%) blur(20px)', borderBottom:'1px solid rgba(0,0,0,0.07)', position:'sticky', top:0, zIndex:50, height:56 }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'0 20px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/iub-logo.png" alt="IUB" style={{ height:34, width:'auto', objectFit:'contain' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
            <div style={{ width:1, height:20, background:'#d2d2d7', margin:'0 2px' }}/>
            <span style={{ fontSize:14, fontWeight:600, color:'#1d1d1f' }}>CGPA Calculator</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f5f7', border:'1px solid #e5e5ea', color:'#1d1d1f', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:500 }}>
              {uploading ? '⏳ Reading…' : fileName ? `📄 ${fileName.slice(0,16)}…` : '📤 Upload'}
              <input type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadPDF(f); e.target.value=''; }}/>
            </label>
            {isGuest
              ? <button onClick={()=>router.push('/register')} style={{ background:'#0f172a', border:'none', color:'#fff', padding:'7px 16px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Save data →</button>
              : <div style={{display:'flex', gap:8}}>
    <button onClick={()=>router.push('/profile')} style={{ background:'none', border:'1px solid #d2d2d7', color:'#1d1d1f', padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>⚙️ Profile</button>
    <button onClick={()=>{ localStorage.clear(); router.push('/'); }} style={{ background:'none', border:'1px solid #d2d2d7', color:'#1d1d1f', padding:'6px 14px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>Sign out</button>
  </div>
            }
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'28px 20px' }}>

        {/* EMPTY STATE */}
        {courses.length===0 && (
          <div style={{ textAlign:'center', padding:'100px 20px' }}>
            <div style={{ fontSize:56, marginBottom:18 }}>📄</div>
            <h2 style={{ fontSize:28, fontWeight:700, letterSpacing:-0.8, marginBottom:8 }}>No transcript yet</h2>
            <p style={{ color:'#6e6e73', fontSize:16, marginBottom:30 }}>Upload your IUB transcript PDF to get started</p>
            <label style={{ background:'#0f172a', color:'#fff', padding:'13px 28px', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer', display:'inline-block', fontFamily:'inherit' }}>
              Upload transcript
              <input type="file" accept=".pdf" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadPDF(f); }}/>
            </label>
          </div>
        )}

        {courses.length>0 && (
          <>
            {/* HERO CARD */}
            <div style={{ background:'#fff', borderRadius:18, padding:'24px 28px', marginBottom:16, border:'1px solid #e5e5ea', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:20 }}>
              <div>
                {isGuest && <span style={{ display:'inline-block', background:'#f5f5f7', color:'#6e6e73', fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:20, marginBottom:8 }}>Guest · Data not saved</span>}
                <h1 style={{ fontSize:'clamp(18px,3vw,24px)', fontWeight:700, letterSpacing:-0.6, margin:'0 0 4px', color:'#1d1d1f' }}>{info?.name||'Student'}</h1>
                <p style={{ color:'#6e6e73', fontSize:13, margin:0 }}>ID: {info?.id||info?.student_id} · {info?.major||info?.department||'IUB'}</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:12, color:'#aeaeb2', fontWeight:500, marginBottom:3, letterSpacing:0.4, textTransform:'uppercase' }}>Cumulative GPA</div>
                <div style={{ fontSize:52, fontWeight:700, letterSpacing:-2, color:cgpaColor, lineHeight:1 }}>{cgpa.toFixed(2)}</div>
                <div style={{ display:'inline-block', background:cgpaColor+'18', color:cgpaColor, fontSize:12, fontWeight:700, padding:'3px 12px', borderRadius:20, marginTop:5 }}>{cgpaLabel}</div>
              </div>
            </div>

            {/* STATS */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:18 }}>
              {[
                { val:cgpa.toFixed(2), label:'CGPA', sub:cgpaLabel, color:cgpaColor },
                { val:earned.toFixed(0), label:'Credits Earned', sub:'Completed', color:'#15803d' },
                { val:attempted.toFixed(0), label:'Credits Attempted', sub:'Total', color:'#d97706' },
                { val:courses.filter(c=>Number(c.credit_earned)>0).length, label:'Courses Passed', sub:'Total', color:'#7c3aed' },
              ].map((s,i)=>(
                <div key={i} style={{ background:'#fff', borderRadius:14, padding:'18px', border:'1px solid #e5e5ea', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize:26, fontWeight:700, letterSpacing:-0.8, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1d1d1f', marginTop:5 }}>{s.label}</div>
                  <div style={{ fontSize:11, color:'#aeaeb2', marginTop:2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:22 }}>
              <button onClick={()=>setAddOpen(true)} style={{ background:'#0f172a', border:'none', color:'#fff', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                + Add course
              </button>
              <button onClick={()=>setRetakeOpen(true)} style={{ background:'#fff', border:'1.5px solid #d2d2d7', color:'#1d1d1f', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                ↺ Retake a course
              </button>
              <button onClick={()=>setTab('recs')} style={{ background:'#eff6ff', border:'1.5px solid #bfdbfe', color:'#1e40af', padding:'10px 20px', borderRadius:20, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                💡 Recommendations
              </button>
            </div>

            {/* TABS */}
            <div style={{ display:'flex', borderBottom:'1px solid #e5e5ea', marginBottom:22 }}>
              {[{k:'overview',l:'Overview'},{k:'courses',l:'All Courses'},{k:'recs',l:'Recommendations'}].map(t=>(
                <button key={t.k} onClick={()=>setTab(t.k as any)}
                  style={{ padding:'10px 20px', fontSize:14, fontWeight:600, border:'none', background:'none', cursor:'pointer', color:tab===t.k?'#0f172a':'#6e6e73', borderBottom:`2px solid ${tab===t.k?'#0f172a':'transparent'}`, marginBottom:-1, transition:'all 0.15s', fontFamily:'inherit' }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {tab==='overview' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {sems.filter(s=>s!=='All').map(sem=>{
                  const sc = courses.filter(c=>c.semester===sem && Number(c.credit_earned)>0);
                  const sgp = sc.reduce((s:number,c:any)=>s+Number(c.grade_point),0);
                  const se = sc.reduce((s:number,c:any)=>s+Number(c.credit_earned),0);
                  const sgpa = se>0 ? (sgp/se).toFixed(2) : '—';
                  const gpaN = parseFloat(sgpa);
                  const gc = gpaN>=3.5?'#15803d':gpaN>=3.0?'#1e40af':gpaN>=2.5?'#d97706':'#dc2626';
                  return (
                    <div key={sem} style={{ background:'#fff', borderRadius:14, padding:'18px 22px', border:'1px solid #e5e5ea', boxShadow:'0 1px 3px rgba(0,0,0,0.03)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                        <h4 style={{ fontSize:15, fontWeight:700, color:'#1d1d1f', margin:0 }}>{sem}</h4>
                        <span style={{ fontSize:13, fontWeight:700, color:gc, background:gc+'15', padding:'3px 12px', borderRadius:20 }}>GPA {sgpa}</span>
                      </div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {courses.filter(c=>c.semester===sem).map((c:any,i:number)=>{
                          const {bg,color}=gradeChip(c.grade);
                          return (
                            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f5f7', borderRadius:8, padding:'5px 9px', border:'1px solid #e5e5ea' }}>
                              <span style={{ fontWeight:700, fontSize:12, color:'#1d1d1f' }}>{c.course_code}</span>
                              <span style={{ background:bg, color, fontWeight:700, fontSize:11, padding:'1px 6px', borderRadius:4 }}>{c.grade}</span>
                              <span style={{ color:'#aeaeb2', fontSize:11 }}>{c.credit}cr</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── COURSES TAB ── */}
            {tab==='courses' && (
              <div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:14 }}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by code or title…"
                    style={{ flex:1, minWidth:200, border:'1.5px solid #d2d2d7', borderRadius:10, padding:'9px 13px', fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit' }}/>
                  <select value={semFilter} onChange={e=>setSemFilter(e.target.value)}
                    style={{ border:'1.5px solid #d2d2d7', borderRadius:10, padding:'9px 13px', fontSize:14, outline:'none', background:'#fff', fontFamily:'inherit', minWidth:160 }}>
                    {sems.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', border:'1px solid #e5e5ea', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                  {/* Header */}
                  <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 72px 64px 100px', padding:'10px 18px', background:'#f5f5f7', borderBottom:'1px solid #e5e5ea' }}>
                    {['Code','Title','Grade','Credit','Semester',''].map((h,i)=>(
                      <div key={h} style={{ fontSize:11, fontWeight:700, color:'#6e6e73', textTransform:'uppercase', letterSpacing:0.5, textAlign:i>1?'center':'left' }}>{h}</div>
                    ))}
                  </div>
                  {filtered.length===0 && (
                    <div style={{ padding:'32px', textAlign:'center', color:'#aeaeb2', fontSize:14 }}>No courses found</div>
                  )}
                  {filtered.map((c:any,i:number)=>{
                    const {bg,color}=gradeChip(c.grade);
                    const isLab = c.course_code.endsWith('L');
                    return (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr 72px 64px 80px 40px', padding:'11px 18px', borderBottom:i<filtered.length-1?'1px solid #f5f5f7':'none', alignItems:'center', background:isLab?'#fafafa':'#fff' }}>
  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
    {isLab && <span style={{ fontSize:10 }}>🧪</span>}
    <span style={{ fontWeight:700, fontSize:13, color:'#0f172a' }}>{c.course_code}</span>
    {c.course_type==='retake' && <span style={{ background:'#dcfce7', color:'#15803d', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4 }}>R</span>}
    {c.course_type==='new' && <span style={{ background:'#dbeafe', color:'#1e40af', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4 }}>N</span>}
  </div>
  <div style={{ fontSize:13, color:'#374151' }}>{c.course_title}</div>
  <div style={{ textAlign:'center' }}>
    <span style={{ background:bg, color, fontWeight:700, fontSize:12, padding:'2px 8px', borderRadius:5 }}>{c.grade}</span>
  </div>
  <div style={{ textAlign:'center', fontSize:13, color:'#6e6e73' }}>{c.credit}</div>
  <div style={{ textAlign:'center', fontSize:11, color:'#aeaeb2' }}>{c.semester?.split(' ').slice(0,2).join(' ')}</div>
  <button
    onClick={() => deleteCourse(c.course_code)}
    style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#aeaeb2', padding:'4px', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}
    title="Remove course">
    ❌
  </button>
</div>
                    );
                  })}
                </div>
                <p style={{ fontSize:12, color:'#aeaeb2', marginTop:8, textAlign:'center' }}>{filtered.length} courses · 🧪 = Lab course</p>
              </div>
            )}

            {/* ── RECOMMENDATIONS TAB ── */}
            {tab==='recs' && (
              <div>
                <div style={{ background:'#fff', borderRadius:14, padding:'18px 22px', marginBottom:14, border:'1px solid #e5e5ea' }}>
                  <h3 style={{ fontSize:16, fontWeight:700, color:'#1d1d1f', margin:'0 0 5px', letterSpacing:-0.4 }}>Retake recommendations</h3>
                  <p style={{ color:'#6e6e73', fontSize:14, margin:0 }}>Courses ranked by CGPA impact if retaken with an A. Theory and lab are shown together — you must retake both.</p>
                </div>

                {recs.length===0 ? (
                  <div style={{ background:'#fff', borderRadius:14, padding:'56px 24px', textAlign:'center', border:'1px solid #e5e5ea' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>🎉</div>
                    <h3 style={{ fontSize:20, fontWeight:700, color:'#1d1d1f', marginBottom:5 }}>Great performance!</h3>
                    <p style={{ color:'#6e6e73' }}>No low-grade courses to recommend for retake.</p>
                  </div>
                ) : recs.map((r:any,i:number)=>{
                  const {bg,color} = gradeChip(r.worstGrade);
                  const hasLab = !!r.lab;
                  return (
                    <div key={i} style={{ background:'#fff', borderRadius:14, padding:'20px 22px', marginBottom:10, border:'1px solid #e5e5ea', display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
                      <div style={{ flex:1, minWidth:220 }}>
                        {/* Badges */}
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                          <span style={{ background:'#0f172a', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:6 }}>#{i+1} Priority</span>
                          <span style={{ background:bg, color, fontWeight:700, fontSize:11, padding:'2px 9px', borderRadius:6 }}>Worst grade: {r.worstGrade}</span>
                          {hasLab && <span style={{ background:'#eff6ff', color:'#1e40af', fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:6 }}>🧪 Theory + Lab</span>}
                        </div>

                        {/* Theory */}
                        {r.theory && (
                          <div style={{ marginBottom: hasLab ? 10 : 0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <span style={{ fontWeight:800, fontSize:16, color:'#1d1d1f', letterSpacing:-0.3 }}>{r.theory.course_code}</span>
                              <span style={{ background:gradeChip(r.theory.grade).bg, color:gradeChip(r.theory.grade).color, fontWeight:700, fontSize:11, padding:'1px 7px', borderRadius:5 }}>{r.theory.grade}</span>
                            </div>
                            <div style={{ fontSize:13, color:'#6e6e73', marginTop:2 }}>{r.theory.course_title}</div>
                            <div style={{ fontSize:12, color:'#aeaeb2', marginTop:2 }}>{r.theory.semester} · {r.theory.credit} credits</div>
                          </div>
                        )}

                        {/* Lab */}
                        {hasLab && (
                          <div style={{ background:'#f5f5f7', borderRadius:8, padding:'10px 12px', border:'1px solid #e5e5ea' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <span style={{ fontSize:13 }}>🧪</span>
                              <span style={{ fontWeight:700, fontSize:13, color:'#1d1d1f' }}>{r.lab.course_code}</span>
                              <span style={{ background:gradeChip(r.lab.grade).bg, color:gradeChip(r.lab.grade).color, fontWeight:700, fontSize:11, padding:'1px 7px', borderRadius:5 }}>{r.lab.grade}</span>
                            </div>
                            <div style={{ fontSize:12, color:'#6e6e73', marginTop:2, paddingLeft:20 }}>{r.lab.course_title} · {r.lab.credit} credit</div>
                          </div>
                        )}

                        {hasLab && (
                          <p style={{ fontSize:12, color:'#d97706', fontWeight:600, marginTop:8, margin:'8px 0 0', display:'flex', alignItems:'center', gap:5 }}>
                            ⚠️ Must retake theory and lab together in the same semester
                          </p>
                        )}
                      </div>

                      {/* Right — CGPA impact + button */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 }}>
                        <div style={{ textAlign:'center', background:'#f0fdf4', borderRadius:12, padding:'12px 20px', border:'1px solid #bbf7d0' }}>
                          <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>If you get A</div>
                          <div style={{ fontSize:32, fontWeight:700, color:'#15803d', letterSpacing:-1, lineHeight:1 }}>{r.potential.toFixed(2)}</div>
                          <div style={{ fontSize:12, color:'#15803d', fontWeight:700, marginTop:2 }}>+{r.gain} CGPA</div>
                        </div>
                        <button onClick={()=>{ setRc({ base:r.base, grade:'A' }); setRetakeOpen(true); }}
                          style={{ background:'#f5f5f7', border:'1.5px solid #e5e5ea', color:'#1d1d1f', padding:'9px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
                          Simulate →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── ADD COURSE MODAL ── */}
      {addOpen && (
        <Sheet title="Add new course" onClose={()=>setAddOpen(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {F('Course Code *', <input value={nc.code} onChange={e=>setNc({...nc,code:e.target.value})} placeholder="e.g. CSE301" style={inp}/>)}
            {F('Grade *', <select value={nc.grade} onChange={e=>setNc({...nc,grade:e.target.value})} style={inp}>{GRADES.map(g=><option key={g} value={g}>{g} ({GP[g]?.toFixed(1)} pts)</option>)}</select>)}
          </div>
          {F('Course Title *', <input value={nc.title} onChange={e=>setNc({...nc,title:e.target.value})} placeholder="e.g. Data Structures" style={inp}/>)}
          {F('Semester *', <input value={nc.sem} onChange={e=>setNc({...nc,sem:e.target.value})} placeholder="e.g. SPRING 2026" style={inp}/>)}

          {/* Theory credit */}
          {F('Theory Credits *',
            <select value={nc.credit} onChange={e=>setNc({...nc,credit:e.target.value})} style={inp}>
              {['1','2','3','4'].map(v=><option key={v} value={v}>{v} credit{parseInt(v)>1?'s':''}</option>)}
            </select>
          )}

          {/* Has lab toggle */}
          <div style={{ background:'#f5f5f7', borderRadius:10, padding:'12px 14px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>setNc({...nc,hasLab:!nc.hasLab})}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1d1d1f' }}>This course has a lab component</div>
              <div style={{ fontSize:12, color:'#6e6e73', marginTop:2 }}>Will also add {nc.code||'COURSE'}L automatically</div>
            </div>
            <div style={{ width:42, height:24, borderRadius:12, background:nc.hasLab?'#0f172a':'#d2d2d7', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left:nc.hasLab?20:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
            </div>
          </div>

          {/* Lab credit */}
          {nc.hasLab && F('Lab Credits *',
            <select value={nc.labCredit} onChange={e=>setNc({...nc,labCredit:e.target.value})} style={inp}>
              {['1','2'].map(v=><option key={v} value={v}>{v} credit{parseInt(v)>1?'s':''}</option>)}
            </select>
          )}

          {/* CGPA Preview */}
          {addPreview && (
            <div style={{ background:'#f5f5f7', borderRadius:10, padding:'11px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'#6e6e73' }}>Projected CGPA{nc.hasLab?' (theory + lab)':''}</span>
              <span style={{ fontSize:20, fontWeight:700, color:'#0f172a' }}>{addPreview.toFixed(2)}</span>
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setAddOpen(false)} style={{ flex:1, background:'#f5f5f7', border:'none', color:'#1d1d1f', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={addCourse} style={{ flex:1, background:'#0f172a', border:'none', color:'#fff', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Add {nc.hasLab?'theory + lab':'course'}
            </button>
          </div>
        </Sheet>
      )}

      {/* ── RETAKE MODAL ── */}
      {retakeOpen && (
        <Sheet title="Retake a course" onClose={()=>setRetakeOpen(false)}>
          {F('Select course to retake *',
            <select value={rc.base} onChange={e=>setRc({...rc,base:e.target.value})} style={inp}>
              <option value="">Choose a course…</option>
              {retakeOptions.map((c:any,i:number)=>{
                const base = baseCode(c.course_code);
                const hasLab = courses.some(x=>x.course_code===base+'L' && Number(x.credit_earned)>0);
                const theory = courses.find(x=>x.course_code===base && Number(x.credit_earned)>0);
                return (
                  <option key={i} value={base}>
                    {base}{hasLab?' + '+base+'L':''} — {theory?.course_title||c.course_title} (Current: {theory?.grade||c.grade}){hasLab?' 🧪':''}
                  </option>
                );
              })}
            </select>
          )}

          {F('New grade *',
            <select value={rc.grade} onChange={e=>setRc({...rc,grade:e.target.value})} style={inp}>
              {GRADES.map(g=><option key={g} value={g}>{g} ({GP[g]?.toFixed(1)} pts)</option>)}
            </select>
          )}

          {/* Lab warning */}
          {rc.base && courses.some(x=>x.course_code===rc.base+'L' && Number(x.credit_earned)>0) && (
            <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'11px 14px', marginBottom:14, fontSize:13, color:'#92400e', display:'flex', alignItems:'flex-start', gap:8 }}>
              <span>⚠️</span>
              <span><strong>Both {rc.base} and {rc.base}L</strong> will be updated with the new grade. In IUB, theory and lab must be retaken together in the same semester.</span>
            </div>
          )}

          {/* CGPA Preview */}
          {retakePreview !== null && (
            <div style={{ background:'#f5f5f7', borderRadius:12, padding:'16px', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-around' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#aeaeb2', marginBottom:3 }}>Current CGPA</div>
                  <div style={{ fontSize:32, fontWeight:700, color:'#6e6e73', letterSpacing:-1 }}>{cgpa.toFixed(2)}</div>
                </div>
                <div style={{ fontSize:22, color:'#d2d2d7' }}>→</div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'#aeaeb2', marginBottom:3 }}>After Retake</div>
                  <div style={{ fontSize:32, fontWeight:700, color:retakePreview>cgpa?'#15803d':retakePreview<cgpa?'#dc2626':'#6e6e73', letterSpacing:-1 }}>{retakePreview.toFixed(2)}</div>
                </div>
              </div>
              {retakePreview>cgpa && (
                <div style={{ textAlign:'center', fontSize:13, color:'#15803d', fontWeight:600, marginTop:8 }}>
                  +{(retakePreview-cgpa).toFixed(2)} improvement
                </div>
              )}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setRetakeOpen(false)} style={{ flex:1, background:'#f5f5f7', border:'none', color:'#1d1d1f', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={doRetake} style={{ flex:1, background:'#0f172a', border:'none', color:'#fff', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Update grade</button>
          </div>
        </Sheet>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        *{box-sizing:border-box}
        button:hover:not(:disabled){opacity:0.82}
        select{appearance:auto}
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:32, height:32, border:'3px solid #e5e7eb', borderTopColor:'#0f172a', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DashContent/>
    </Suspense>
  );
}
