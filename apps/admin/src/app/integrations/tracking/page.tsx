"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type KeyRow = { key: string; label: string; placeholder?: string; help?: string };
const DEFAULT_KEYS: KeyRow[] = [
  // Core analytics / pixels
  { key: 'FB_PIXEL_ID', label: 'Facebook Pixel ID', placeholder: '1234567890' },
  { key: 'GA_MEASUREMENT_ID', label: 'Google Analytics (GA4) Measurement ID', placeholder: 'G-XXXXXXXXXX' },
  { key: 'GOOGLE_TAG_MANAGER_ID', label: 'Google Tag Manager ID', placeholder: 'GTM-XXXXXXX' },
  { key: 'GOOGLE_SEARCH_CONSOLE_VERIFICATION', label: 'Google Search Console Verification', placeholder: 'verification token' },
  { key: 'TIKTOK_PIXEL_ID', label: 'TikTok Pixel ID', placeholder: 'C1A2B3...' },
  { key: 'GOOGLE_ADS_CONVERSION_ID', label: 'Google Ads Conversion ID', placeholder: 'AW-XXXXXXX' },
  { key: 'MICROSOFT_UET_TAG', label: 'Microsoft Ads UET Tag', placeholder: 'XXXXXXXXX' },
  { key: 'SNAP_PIXEL_ID', label: 'Snapchat Pixel ID', placeholder: 'XXXXXXXX' },
  { key: 'TWITTER_PIXEL_ID', label: 'Twitter Pixel ID', placeholder: 'oXXXXXXXX' },
  { key: 'LINKEDIN_INSIGHT_ID', label: 'LinkedIn Insight Tag ID', placeholder: 'XXXXXXX' },
  { key: 'PINTEREST_TAG_ID', label: 'Pinterest Tag ID', placeholder: 'XXXXXXXX' },
  // Product analytics / session replay
  { key: 'MIXPANEL_TOKEN', label: 'Mixpanel Token' },
  { key: 'AMPLITUDE_API_KEY', label: 'Amplitude API Key' },
  { key: 'SEGMENT_WRITE_KEY', label: 'Segment Write Key' },
  { key: 'HOTJAR_SITE_ID', label: 'Hotjar Site ID' },
  { key: 'CLARITY_PROJECT_ID', label: 'Microsoft Clarity Project ID' },
  { key: 'LOGROCKET_APP_ID', label: 'LogRocket App ID' },
  { key: 'FULLSTORY_ORG', label: 'FullStory Org' },
  { key: 'OPTIMIZELY_SDK_KEY', label: 'Optimizely SDK Key' },
  // Consent & CMP
  { key: 'CONSENT_MODE', label: 'Google Consent Mode (v2) enable', placeholder: 'on/off' },
  { key: 'ONETRUST_DOMAIN_ID', label: 'OneTrust Domain ID' },
  { key: 'COOKIEBOT_ID', label: 'Cookiebot ID' },
  // Push / notifications
  { key: 'ONESIGNAL_APP_ID', label: 'OneSignal App ID' },
  { key: 'FCM_VAPID_PUBLIC_KEY', label: 'Firebase FCM VAPID Public Key' },
  // Monitoring & logs
  { key: 'SENTRY_DSN', label: 'Sentry DSN' },
  { key: 'NEWRELIC_BROWSER_LICENSE', label: 'New Relic Browser License' },
  { key: 'DATADOG_CLIENT_TOKEN', label: 'Datadog Client Token' },
  { key: 'CLOUDFLARE_ANALYTICS_TOKEN', label: 'Cloudflare Web Analytics Token' },
  // Chat & support
  { key: 'INTERCOM_APP_ID', label: 'Intercom App ID' },
  { key: 'CRISP_WEBSITE_ID', label: 'Crisp Website ID' },
  { key: 'TAWK_PROPERTY_ID', label: 'Tawk.to Property ID' },
  { key: 'ZENDESK_KEY', label: 'Zendesk Key' },
  // Security
  { key: 'RECAPTCHA_SITE_KEY', label: 'reCAPTCHA v3 Site Key' },
  { key: 'HCAPTCHA_SITE_KEY', label: 'hCaptcha Site Key' },
  { key: 'TURNSTILE_SITE_KEY', label: 'Cloudflare Turnstile Site Key' },
  // Maps
  { key: 'GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key' },
  { key: 'MAPBOX_PUBLIC_TOKEN', label: 'Mapbox Public Token' },
  // Search / recommendations (client-safe keys)
  { key: 'ALGOLIA_APP_ID', label: 'Algolia App ID' },
  { key: 'ALGOLIA_SEARCH_KEY', label: 'Algolia Search-Only API Key' },
  { key: 'ALGOLIA_INDEX', label: 'Algolia Index Name' },
  { key: 'TYPESENSE_HOST', label: 'Typesense Host (readonly)' },
  { key: 'TYPESENSE_SEARCH_KEY', label: 'Typesense Search Key' },
];

export default function TrackingIntegrations(): JSX.Element {
  const apiBase = resolveApiBase();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [rows, setRows] = React.useState<KeyRow[]>(DEFAULT_KEYS);
  const [list, setList] = React.useState<any[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string>('');
  const [newKey, setNewKey] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');

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
    const all = rows;
    for (const row of all){ next[row.key] = String(lastByKey.get(row.key)||''); }
    setValues(next);
  }
  React.useEffect(()=>{ load().catch(()=>{}); },[]);

  function setVal(k:string, v:string){ setValues(s=> ({ ...s, [k]: v })); }
  async function save(){
    setSaving(true); setMsg('');
    try{
      const payload: Record<string,string> = {};
      for (const row of rows){ payload[row.key] = values[row.key] ?? ''; }
      await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ provider:'tracking', config: payload }) });
      setMsg('تم الحفظ بنجاح');
      await load();
    } finally { setSaving(false); }
  }

  function disableKey(k: string){ setValues(s=> ({ ...s, [k]: '' })); }
  function deleteKey(k: string){ setValues(s=> ({ ...s, [k]: '' })); }
  function addCustom(){
    const k = newKey.trim().toUpperCase();
    if (!k) return;
    const label = newLabel.trim() || k;
    if (!rows.find(r => r.key === k)) setRows(r=> [...r, { key: k, label }]);
    setValues(s=> ({ ...s, [k]: '' }));
    setNewKey(''); setNewLabel('');
  }

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 20, marginBottom: 12 }}>تتبّع وتحليلات</h1>
      <p style={{ color: 'var(--sub)', marginBottom: 12 }}>أدخل مفاتيح التتبع وسيتم حقن الأكواد تلقائياً على الواجهات.</p>
      <section style={{ display:'grid', gap: 12 }}>
        {rows.map(row=> (
          <div key={row.key} style={{ display:'grid', gap:6 }}>
            <label style={{ fontWeight:700 }}>{row.label}</label>
            <input
              value={values[row.key]||''}
              onChange={e=> setVal(row.key, e.target.value)}
              placeholder={row.placeholder||''}
              style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }}
            />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=> disableKey(row.key)} className="btn" style={{ background:'#374151' }}>تعطيل</button>
              <button onClick={()=> deleteKey(row.key)} className="btn" style={{ background:'#7f1d1d' }}>حذف</button>
            </div>
            {row.help && <div style={{ color:'var(--sub)', fontSize:12 }}>{row.help}</div>}
          </div>
        ))}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={save} disabled={saving} className="btn">{saving? 'يحفظ…' : 'حفظ'}</button>
          {msg && <span style={{ color:'#22c55e' }}>{msg}</span>}
        </div>
      </section>

      <h2 style={{ fontWeight:800, fontSize:16, marginTop:24, marginBottom:8 }}>إضافة حقل مخصص</h2>
      <div className="panel" style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'center' }}>
        <input value={newKey} onChange={(e)=> setNewKey(e.target.value)} placeholder="KEY_NAME" style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        <input value={newLabel} onChange={(e)=> setNewLabel(e.target.value)} placeholder="التسمية (اختياري)" style={{ height:44, borderRadius:12, border:'1px solid var(--muted2)', padding:'0 12px', background:'#0b0e14', color:'#e2e8f0' }} />
        <button onClick={addCustom} className="btn">إضافة</button>
      </div>

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

