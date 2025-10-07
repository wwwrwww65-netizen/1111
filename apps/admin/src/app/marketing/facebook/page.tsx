"use client";
import React from "react";

export default function FacebookMarketingPage(): JSX.Element {
  const [msg, setMsg] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [site, setSite] = React.useState<'web'|'mweb'>('web');
  const [settings, setSettings] = React.useState<{ pixelId?:string; accessToken?:string; catalogId?:string; feedToken?:string; eventsEnabled:boolean; advancedMatching:boolean }>({ eventsEnabled: true, advancedMatching: true });
  const [analytics, setAnalytics] = React.useState<any>({ roas:0, conv:0, purchases:0, cpa:0 });
  const [recs, setRecs] = React.useState<Array<{id:string;name:string;image:string;price:number}>>([]);
  const [feedUrl, setFeedUrl] = React.useState<string>("");

  async function load(){
    try{
      const s = await (await fetch(`/api/admin/marketing/facebook/settings?site=${site}`, { credentials:'include' })).json();
      if (s?.settings) setSettings(s.settings);
      const a = await (await fetch(`/api/admin/marketing/facebook/analytics?site=${site}`, { credentials:'include' })).json();
      setAnalytics(a?.analytics||{});
      const r = await (await fetch(`/api/admin/marketing/facebook/recommendations?site=${site}`, { credentials:'include' })).json();
      setRecs(r?.items||[]);
      setFeedUrl(`${location.origin}/api/marketing/facebook/catalog.xml?site=${site}&token=${encodeURIComponent(s?.settings?.feedToken||'')}`);
    }catch{}
  }
  React.useEffect(()=>{ load(); }, [site]);

  async function save(){
    setSaving(true); setMsg('');
    try{
      const r = await fetch('/api/admin/marketing/facebook/settings', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, settings }) });
      if (!r.ok) throw new Error('فشل الحفظ'); setMsg('تم الحفظ');
    }catch(e:any){ setMsg(e?.message||'فشل الحفظ'); }
    finally{ setSaving(false); setTimeout(()=> setMsg(''), 1600); }
  }

  return (
    <main>
      <h1 style={{ marginBottom:12 }}>تسويق فيسبوك</h1>
      {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
        <select className="input" value={site} onChange={e=> setSite(e.target.value as any)}>
          <option value="web">jeeey.com</option>
          <option value="mweb">m.jeeey.com</option>
        </select>
        <button className="btn" onClick={save} disabled={saving}>حفظ</button>
        <a className="btn btn-outline" href={feedUrl} target="_blank" rel="noreferrer">فتح كتالوج XML</a>
      </div>

      <div className="panel" style={{ padding:12 }}>
        <h3 style={{ marginTop:0 }}>إعدادات Facebook</h3>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <label>Pixel ID<input className="input" value={settings.pixelId||''} onChange={e=> setSettings(s=> ({ ...s, pixelId: e.target.value }))} /></label>
          <label>Access Token<input className="input" value={settings.accessToken||''} onChange={e=> setSettings(s=> ({ ...s, accessToken: e.target.value }))} /></label>
          <label>Catalog ID<input className="input" value={settings.catalogId||''} onChange={e=> setSettings(s=> ({ ...s, catalogId: e.target.value }))} /></label>
          <label>Feed Token<input className="input" value={settings.feedToken||''} onChange={e=> setSettings(s=> ({ ...s, feedToken: e.target.value }))} /></label>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={settings.eventsEnabled} onChange={e=> setSettings(s=> ({ ...s, eventsEnabled: e.target.checked }))} /> تفعيل أحداث Pixel</label>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={settings.advancedMatching} onChange={e=> setSettings(s=> ({ ...s, advancedMatching: e.target.checked }))} /> Advanced Matching</label>
        </div>
      </div>

      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>إحصاءات</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(160px, 1fr))', gap:12 }}>
          <Stat title="ROAS" value={analytics.roas?.toFixed?.(2)||'0.00'} />
          <Stat title="Conversions" value={analytics.conv||0} />
          <Stat title="Purchases" value={analytics.purchases||0} />
          <Stat title="CPA" value={analytics.cpa||0} />
        </div>
      </div>

      <div className="panel" style={{ padding:12, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>توصيات منتجات</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(160px, 1fr))', gap:12 }}>
          {recs.map(p=> (
            <div key={p.id} style={{ border:'1px solid #1c2333', borderRadius:8, padding:8 }}>
              <img src={p.image} alt={p.name} style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:6 }} />
              <div style={{ marginTop:6, fontWeight:600 }}>{p.name}</div>
              <div style={{ color:'#16a34a' }}>{p.price} ر.س</div>
            </div>
          ))}
          {!recs.length && (<div style={{ color:'#94a3b8' }}>لا توجد توصيات بعد</div>)}
        </div>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title:string; value:any }): JSX.Element {
  return (
    <div style={{ background:'#0b0e14', border:'1px solid #1c2333', borderRadius:12, padding:12 }}>
      <div style={{ color:'#94a3b8', fontSize:12 }}>{title}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}
