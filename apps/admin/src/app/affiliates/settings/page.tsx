"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function AffiliateSettingsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [enabled, setEnabled] = React.useState(true);
  const [cookieDays, setCookieDays] = React.useState('30');
  const [baseRate, setBaseRate] = React.useState('5');
  const [busy, setBusy] = React.useState(false);

  async function load(){
    const j = await (await fetch(`${apiBase}/api/admin/affiliates/settings`, { credentials:'include' })).json();
    if (j && j.settings){
      setEnabled(!!j.settings.enabled);
      setCookieDays(String(j.settings.cookieDays ?? '30'));
      setBaseRate(String(j.settings.baseRate ?? '5'));
    }
  }
  React.useEffect(()=>{ load().catch(()=>{}); }, [apiBase]);

  async function save(){
    setBusy(true);
    const res = await fetch(`${apiBase}/api/admin/affiliates/settings`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ enabled, cookieDays: Number(cookieDays||0), baseRate: Number(baseRate||0) }) });
    setBusy(false);
    if (!res.ok) { alert('تعذر الحفظ'); return; }
    alert('تم الحفظ');
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إعدادات برنامج العمولة</h1>
      <div className="grid cols-3" style={{gap:8}}>
        <label style={{display:'flex',alignItems:'center', gap:6}}>
          <input type="checkbox" checked={enabled} onChange={e=> setEnabled(e.target.checked)} />
          تفعيل البرنامج
        </label>
        <input className="input" placeholder="مدة الكوكيز (أيام)" value={cookieDays} onChange={e=> setCookieDays(e.target.value)} />
        <input className="input" placeholder="قاعدة العمولة (%)" value={baseRate} onChange={e=> setBaseRate(e.target.value)} />
      </div>
      <div className="mt-3"><button className="btn btn-md" onClick={save} disabled={busy}>حفظ</button></div>
    </div>
  );
}

