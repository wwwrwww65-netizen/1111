"use client";
import React from "react";
export const dynamic = 'force-dynamic';

export default function SizeTypePage({ params }: { params: { typeId: string } }): JSX.Element {
  const { typeId } = params;
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string>("");
  async function load(){ const j = await (await fetch(`${apiBase}/api/admin/attributes/size-types/${typeId}/sizes`, { credentials:'include', cache:'no-store' })).json(); setRows(j.sizes||[]); }
  React.useEffect(()=>{ load(); },[apiBase, typeId]);
  async function add(){
    setError("");
    const r = await fetch(`${apiBase}/api/admin/attributes/size-types/${typeId}/sizes`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name }) });
    if(!r.ok){
      try { const j = await r.json(); setError(j?.message || 'فشل الإضافة'); } catch { setError('فشل الإضافة'); }
      return;
    }
    setName("");
    await load();
  }
  return (
    <main style={{ maxWidth: 900, margin:'0 auto', padding:16 }}>
      <h1 style={{ marginBottom:16, fontSize:22, fontWeight:700 }}>أنواع المقاسات</h1>
      <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16, marginBottom:16 }}>
        {error && (<div style={{ marginBottom:8, background:'#7f1d1d', color:'#fee2e2', padding:'8px 10px', borderRadius:8 }}>{error}</div>)}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:12 }}>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="اسم المقاس" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <button onClick={add} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
        </div>
      </section>
      <section style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead><tr><th style={{textAlign:'right',padding:12,borderBottom:'1px solid #1c2333',background:'#0f1320'}}>الاسم</th></tr></thead>
          <tbody>
            {rows.map((s:any, idx:number)=> (
              <tr key={s.id} style={{ background: idx%2? '#0a0e17':'transparent' }}>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{s.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

