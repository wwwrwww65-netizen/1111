"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function BackupsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [schedule, setSchedule] = React.useState<string>("daily");
  const [retained, setRetained] = React.useState<number>(30);
  const [progress, setProgress] = React.useState<number>(0);
  const [msg, setMsg] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/backups/list`, { credentials:'include', headers:{ ...authHeaders() } })).json(); setRows(j.backups||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);
  async function run(){
    setMsg('جاري النسخ الاحتياطي…'); setProgress(10);
    try{ await fetch(`${apiBase}/api/admin/backups/run`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); setProgress(100); setMsg('اكتمل النسخ الاحتياطي'); } catch { setMsg('فشل النسخ الاحتياطي'); }
    finally { setTimeout(()=> setMsg(''), 2000); await load(); setProgress(0); }
  }
  const [confirming, setConfirming] = React.useState<{open:boolean; id:string|null; text:string}>({ open:false, id:null, text:'' });
  async function restore(id: string){ setConfirming({ open:true, id, text: `سيتم استعادة النسخة ${id.slice(0,6)} وقد تفقد تغييرات غير محفوظة. هل أنت متأكد؟` }); }
  async function doRestore(){ if (!confirming.id) return; setMsg('جاري الاستعادة…'); setProgress(20); try { await fetch(`${apiBase}/api/admin/backups/${confirming.id}/restore`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); setProgress(100); setMsg('تمت الاستعادة بنجاح'); } catch { setMsg('فشلت الاستعادة'); } finally { setTimeout(()=> setMsg(''), 2500); setProgress(0); setConfirming({ open:false, id:null, text:'' }); await load(); } }
  async function saveSchedule(){ await fetch(`${apiBase}/api/admin/backups/schedule`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ schedule }) }); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>النسخ الاحتياطي</h1>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <button onClick={run} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>تشغيل نسخة</button>
        <select value={schedule} onChange={(e)=>setSchedule(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="daily">تشغيل يومي</option>
          <option value="off">إيقاف</option>
        </select>
        <button onClick={saveSchedule} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>حفظ الجدولة</button>
        <div style={{ marginInlineStart:'auto', color:'#94a3b8' }}>الاحتفاظ: آخر {retained} يومًا (مدار عبر الخادم)</div>
      </div>
      {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`} role="status" aria-live="polite">{msg}</div>)}
      {progress>0 && (
        <div style={{ height:8, background:'#1f2937', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
          <div style={{ width:`${progress}%`, height:'100%', background:'#22c55e', transition:'width .3s' }} />
        </div>
      )}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>#</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>التاريخ</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحالة</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحجم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الموقع</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b)=> (
            <tr key={b.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{b.id.slice(0,6)}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{new Date(b.createdAt).toLocaleString()}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{b.status}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{b.sizeBytes ? (Math.round(b.sizeBytes/1024))+' KB' : '-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{b.location || '-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={()=>restore(b.id)} style={{ padding:'6px 10px', background:'#064e3b', color:'#e5e7eb', borderRadius:6 }}>استعادة</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {confirming.open && (
        <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'grid', placeItems:'center', zIndex:1000 }}>
          <div className="panel" style={{ width:'min(560px, 96vw)', padding:16 }}>
            <h3 style={{ marginTop:0 }}>تأكيد الاستعادة</h3>
            <p style={{ color:'#fbbf24' }}>{confirming.text}</p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={()=> setConfirming({ open:false, id:null, text:'' })}>إلغاء</button>
              <button className="btn" onClick={doRestore}>أوافق وأستعيد</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

