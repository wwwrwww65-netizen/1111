"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../components/Mobile';

export default function MobileSettings(): JSX.Element {
  const [form, setForm] = React.useState<Record<string,string>>({ siteName:'', supportEmail:'' });
  const [busy, setBusy] = React.useState(false);
  React.useEffect(()=>{ (async()=>{ try{ const j = await (await fetch(`${resolveApiBase()}/api/admin/settings/list`, { credentials:'include' })).json(); const o:Record<string,string>={}; (j.items||j.settings||[]).forEach((s:any)=> o[s.key]=s.value); setForm((f)=> ({ ...f, siteName: o['site.name']||f.siteName, supportEmail: o['support.email']||f.supportEmail })); }catch{} })(); }, []);
  async function save(){ setBusy(true); try{ await fetch(`${resolveApiBase()}/api/admin/settings/bulk`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ items: [ { key:'site.name', value: form.siteName }, { key:'support.email', value: form.supportEmail } ] }) }); }catch{} finally{ setBusy(false); } }
  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>الإعدادات</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>اسم الموقع</div>
            <input className="input" value={form.siteName} onChange={e=> setForm(s=> ({ ...s, siteName:e.target.value }))} />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>بريد الدعم</div>
            <input className="input" value={form.supportEmail} onChange={e=> setForm(s=> ({ ...s, supportEmail:e.target.value }))} />
          </label>
        </FormGrid>
      </div>
      <ActionBarMobile>
        <button className="btn" disabled={busy} onClick={save}>حفظ</button>
      </ActionBarMobile>
    </div>
  );
}

