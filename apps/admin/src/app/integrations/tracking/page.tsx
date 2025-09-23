"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type KeyRow = { key: string; label: string; placeholder?: string; help?: string };
const KEYS: KeyRow[] = [
  { key: 'FB_PIXEL_ID', label: 'Facebook Pixel ID', placeholder: 'e.g. 1234567890' },
  { key: 'GA_MEASUREMENT_ID', label: 'Google Analytics (GA4) Measurement ID', placeholder: 'G-XXXXXXXXXX' },
  { key: 'GOOGLE_TAG_MANAGER_ID', label: 'Google Tag Manager ID', placeholder: 'GTM-XXXXXXX' },
  { key: 'GOOGLE_SEARCH_CONSOLE_VERIFICATION', label: 'Google Search Console Verification', placeholder: 'verification token' },
  { key: 'TIKTOK_PIXEL_ID', label: 'TikTok Pixel ID', placeholder: 'e.g. C1A2B3...' },
];

export default function TrackingIntegrations(): JSX.Element {
  const apiBase = resolveApiBase();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [list, setList] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');

  async function load(){
    const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json();
    setList(j.integrations||[]);
    const lastByKey = new Map<string, any>();
    for (const it of (j.integrations||[])){
      if (typeof it.config === 'object'){
        Object.entries(it.config).forEach(([k,v])=> lastByKey.set(k, v as string));
      }
    }
    const next: Record<string,string> = {};
    for (const row of KEYS){ next[row.key] = String(lastByKey.get(row.key)||''); }
    setValues(next);
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[]);

  function setVal(k:string, v:string){ setValues(s=> ({ ...s, [k]: v })); }
  async function save(){
    setSaving(true); setMsg('');
    try{
      const payload: Record<string,string> = {};
      for (const row of KEYS){ if (values[row.key]) payload[row.key] = values[row.key]; }
      await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ provider:'tracking', config: payload }) });
      setMsg('تم الحفظ بنجاح');
      await load();
    } finally { setSaving(false); }
  }

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>تتبّع وتحليلات</h1>
      <p style={{ color: 'var(--sub)', marginBottom: 12 }}>أدخل مفاتيح التتبع وسيتم حقن الأكواد تلقائياً على الواجهات.</p>
      <section style={{ display:'grid', gap: 12 }}>
        {KEYS.map(row=> (
          <div key={row.key} style={{ display:'grid', gap:6 }}>
            <label style={{ fontWeight:700 }}>{row.label}</label>
            <input
              value={values[row.key]||''}
              onChange={e=> setVal(row.key, e.target.value)}
              placeholder={row.placeholder||''}
              style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }}
            />
            {row.help && <div style={{ color:'var(--sub)', fontSize:12 }}>{row.help}</div>}
          </div>
        ))}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'يحفظ…' : 'حفظ'}</button>
          {msg && <span style={{ color:'#22c55e' }}>{msg}</span>}
        </div>
      </section>

      <h2 style={{ fontWeight:800, fontSize:16, marginTop:24, marginBottom:8 }}>آخر الإعدادات المحفوظة</h2>
      <div className="panel" style={{ display:'grid', gap:8 }}>
        {list.map((it:any)=> (
          <div key={it.id} style={{ border:'1px solid var(--muted2)', borderRadius:12, padding:12 }}>
            <div style={{ fontWeight:700 }}>{it.provider}</div>
            <pre style={{ margin:0, whiteSpace:'pre-wrap', color:'var(--sub)' }}>{JSON.stringify(it.config,null,2)}</pre>
          </div>
        ))}
      </div>
    </main>
  );
}

