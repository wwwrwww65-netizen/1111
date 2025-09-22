"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function ManualCampaignsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [title, setTitle] = React.useState('');
  const [channel, setChannel] = React.useState<'EMAIL'|'PUSH'|'SMS'>('EMAIL');
  const [scheduleAt, setScheduleAt] = React.useState('');
  const [body, setBody] = React.useState('');
  const [segment, setSegment] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit(){
    setBusy(true);
    const res = await fetch(`${apiBase}/api/admin/notifications/manual`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      title, body, channel, scheduleAt: scheduleAt||undefined, segment: segment||undefined
    }) });
    setBusy(false);
    if (!res.ok) { alert('تعذر الإرسال'); return; }
    setTitle(''); setBody(''); setScheduleAt(''); setSegment('');
    alert('تم الإرسال/الجدولة');
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التنبيهات اليدوية</h1>
      <div className="grid cols-3" style={{gap:8}}>
        <input className="input" placeholder="العنوان" value={title} onChange={e=> setTitle(e.target.value)} />
        <select className="select" value={channel} onChange={e=> setChannel(e.target.value as any)}>
          <option value="EMAIL">بريد</option>
          <option value="PUSH">Push</option>
          <option value="SMS">SMS</option>
        </select>
        <input className="input" placeholder="جدولة (ISO)" value={scheduleAt} onChange={e=> setScheduleAt(e.target.value)} />
      </div>
      <input className="input mt-2" placeholder="شريحة الاستهداف (اختياري)" value={segment} onChange={e=> setSegment(e.target.value)} />
      <textarea className="input" placeholder="المحتوى" style={{minHeight:140}} value={body} onChange={e=> setBody(e.target.value)} />
      <div className="mt-2"><button className="btn btn-md" onClick={submit} disabled={busy}>إرسال/جدولة</button></div>
    </div>
  );
}

