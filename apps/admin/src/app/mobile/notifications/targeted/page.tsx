"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

export default function MobileTargetedNotifications(): JSX.Element {
  const [dsl, setDsl] = React.useState('status=ACTIVE');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [channel, setChannel] = React.useState<'EMAIL'|'PUSH'|'SMS'>('PUSH');
  const [count, setCount] = React.useState<number|undefined>(undefined);
  const [busy, setBusy] = React.useState(false);

  async function test(){
    setBusy(true);
    try{ const r = await fetch(`${resolveApiBase()}/api/admin/notifications/target/test`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ dsl }) }); const j = await r.json().catch(()=>({})); setCount(j.count||0);}catch{ setCount(undefined);} finally{ setBusy(false); }
  }
  async function send(){
    setBusy(true);
    try{ const r = await fetch(`${resolveApiBase()}/api/admin/notifications/target/send`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ dsl, title, body, channel }) }); if(!r.ok) throw new Error('failed'); alert('تم الإرسال'); }catch{ alert('تعذر الإرسال'); } finally{ setBusy(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>إشعارات موجهة</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>DSL</div>
            <input className="input" value={dsl} onChange={e=> setDsl(e.target.value)} placeholder="status=ACTIVE" />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>القناة</div>
            <select className="select" value={channel} onChange={e=> setChannel(e.target.value as any)}>
              <option value="PUSH">PUSH</option>
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
            </select>
          </label>
          <label style={{ gridColumn:'1 / -1' }}>
            <div style={{ marginBottom:6 }}>العنوان</div>
            <input className="input" value={title} onChange={e=> setTitle(e.target.value)} />
          </label>
          <label style={{ gridColumn:'1 / -1' }}>
            <div style={{ marginBottom:6 }}>النص</div>
            <textarea className="input" rows={4} value={body} onChange={e=> setBody(e.target.value)} />
          </label>
        </FormGrid>
      </div>
      <ActionBarMobile>
        <button className="btn btn-outline" onClick={test} disabled={busy}>اختبار ({count ?? '—'})</button>
        <button className="btn" onClick={send} disabled={busy}>إرسال</button>
      </ActionBarMobile>
    </div>
  );
}

