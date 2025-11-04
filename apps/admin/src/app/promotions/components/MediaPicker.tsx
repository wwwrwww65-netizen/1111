"use client";
import React from 'react';

export function MediaPicker({ apiBase, value, onChange, onClose }: { apiBase: string; value?: string; onChange: (url: string)=> void; onClose: ()=> void }): JSX.Element {
  const [assets, setAssets] = React.useState<Array<{ id:string; url:string; alt?:string }>>([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  async function load(){
    setLoading(true);
    try{
      const url = new URL(`${apiBase}/api/admin/media/list`);
      if (q.trim()) url.searchParams.set('search', q.trim());
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      setAssets(j.assets||[]);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);
  return (
    <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:1100 }} onClick={onClose}>
      <div style={{ width:'min(900px,96vw)', maxHeight:'90vh', overflow:'auto', background:'var(--panel,#0b0e14)', border:'1px solid #1c2333', borderRadius:12, padding:12 }} onClick={(e)=> e.stopPropagation()}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input className="input" placeholder="بحث في الوسائط" value={q} onChange={(e)=> setQ(e.target.value)} />
          <button className="btn" onClick={load}>بحث</button>
          <div style={{ marginInlineStart:'auto' }}>
            <input className="input" placeholder="أو أدخل رابط وسائط https://" defaultValue={value||''} onKeyDown={(e)=>{ if (e.key==='Enter'){ onChange((e.target as HTMLInputElement).value.trim()); onClose(); } }} />
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          {loading? <div className="skeleton" style={{ height:180 }} /> : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:10 }}>
              {assets.map(a=> (
                <button key={a.id} className="panel" style={{ padding:6, border:'1px solid #1c2333', borderRadius:8 }} onClick={()=>{ onChange(a.url); onClose(); }}>
                  <img src={a.url} alt={a.alt||''} style={{ width:'100%', height:110, objectFit:'cover', borderRadius:6 }} />
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:4, direction:'ltr', textAlign:'start', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.url}</div>
                </button>
              ))}
              {!assets.length && <div style={{ color:'#94a3b8' }}>لا توجد وسائط</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


