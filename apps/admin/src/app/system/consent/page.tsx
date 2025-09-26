"use client";
import React from 'react';

export default function ConsentAdminPage(): JSX.Element {
  const [cfg, setCfg] = React.useState<any>({ tracking:true, utm:true, personalization:true });
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(()=>{ (async()=>{ try{ const r = await fetch('/api/admin/consent', { credentials:'include' }); const j = await r.json(); if (r.ok) setCfg(j.config||{}); } finally { setLoading(false); } })(); }, []);

  async function save(){ setErr(''); try{ const r = await fetch('/api/admin/consent', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ config: cfg }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error||'failed'); } catch(e:any){ setErr(e.message||'failed'); } }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        <h1 style={{ marginTop:0 }}>إعدادات الموافقة (Consent)</h1>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 120 }} /> : (
          <div className="panel" style={{ padding:12, display:'grid', gap:12, maxWidth:720 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!cfg.tracking} onChange={(e)=> setCfg((c:any)=> ({...c, tracking: e.target.checked}))} /> تمكين تتبّع الأحداث (page_view/add_to_cart/…)
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!cfg.utm} onChange={(e)=> setCfg((c:any)=> ({...c, utm: e.target.checked}))} /> حفظ UTM وتحليلات الحملات
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" checked={!!cfg.personalization} onChange={(e)=> setCfg((c:any)=> ({...c, personalization: e.target.checked}))} /> تخصيص المحتوى والتوصيات
            </label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={save} className="btn">حفظ</button>
              {err && <span className="error">{err}</span>}
            </div>
            <div style={{ color:'var(--sub)', fontSize:12 }}>هذه الإعدادات تُطبّق على jeeey.com و m.jeeey.com (عبر API مشترك).</div>
          </div>
        )}
      </main>
    </div>
  );
}

