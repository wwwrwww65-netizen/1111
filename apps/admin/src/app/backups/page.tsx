"use client";
import React from "react";

export default function BackupsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [schedule, setSchedule] = React.useState<string>("daily");
  const apiBase = React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window!=="undefined" ? window.location.origin.replace('jeeey-manger','jeeeyai') : 'http://localhost:4000'), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  },[]);
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/backups/list`, { credentials:'include', headers:{ ...authHeaders() } })).json(); setRows(j.backups||[]); }
  React.useEffect(()=>{ load(); },[apiBase]);
  async function run(){ await fetch(`${apiBase}/api/admin/backups/run`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
  async function restore(id: string){ await fetch(`${apiBase}/api/admin/backups/${id}/restore`, { method:'POST', headers:{ ...authHeaders() }, credentials:'include' }); await load(); }
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
      </div>
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
    </main>
  );
}

