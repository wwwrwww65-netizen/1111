"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

export default function MobileManualNotifications(): JSX.Element {
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [channel, setChannel] = React.useState<'EMAIL'|'PUSH'|'SMS'>('PUSH');
  const [scheduleAt, setScheduleAt] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function send(){
    setBusy(true);
    try {
      const res = await fetch(`${resolveApiBase()}/api/admin/notifications/manual`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ title, body, channel, scheduleAt: scheduleAt||undefined, segment: segment||undefined }) });
      if(!res.ok) throw new Error('failed');
      alert('تم الإرسال');
      setTitle(''); setBody(''); setScheduleAt(''); setSegment('');
    } catch { alert('تعذر الإرسال'); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>إشعار يدوي</div>
        <FormGrid>
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
          <label>
            <div style={{ marginBottom:6 }}>جدولة (اختياري)</div>
            <input className="input" type="datetime-local" value={scheduleAt} onChange={e=> setScheduleAt(e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom:6 }}>القطاع/الشريحة (اختياري)</div>
            <input className="input" value={segment} onChange={e=> setSegment(e.target.value)} placeholder="ALL أو VIP مثلاً" />
          </label>
        </FormGrid>
      </div>
      <ActionBarMobile>
        <button className="btn" disabled={busy} onClick={send}>إرسال</button>
      </ActionBarMobile>
    </div>
  );
}

