"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function TargetedNotificationsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [dsl, setDsl] = React.useState('');
  const [count, setCount] = React.useState<number|null>(null);
  const [title, setTitle] = React.useState('');
  const [channel, setChannel] = React.useState<'EMAIL'|'PUSH'|'SMS'>('EMAIL');
  const [body, setBody] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function test(){
    setBusy(true);
    const res = await fetch(`${apiBase}/api/admin/notifications/target/test`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ dsl }) });
    const j = await res.json().catch(()=>({}));
    setCount(j.count ?? 0);
    setBusy(false);
  }

  async function send(){
    setBusy(true);
    const res = await fetch(`${apiBase}/api/admin/notifications/target/send`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({ dsl, title, body, channel }) });
    setBusy(false);
    if (!res.ok) { alert('تعذر الإرسال'); return; }
    setTitle(''); setBody('');
    alert('تم إرسال الحملة');
  }

  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">التنبيهات المخصّصة</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center', position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0'}}>
        <input className="input" placeholder="شرط الاستهداف (DSL)" value={dsl} onChange={e=> setDsl(e.target.value)} />
        <button className="btn btn-sm" onClick={test} disabled={busy}>اختبار</button>
        <div className="text-sm" style={{color:'var(--sub)'}}>{count!==null? `المستهدفون: ${count}` : ''}</div>
      </div>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
        <input className="input" placeholder="العنوان" value={title} onChange={e=> setTitle(e.target.value)} />
        <select className="input" value={channel} onChange={e=> setChannel(e.target.value as any)}>
          <option value="EMAIL">بريد</option>
          <option value="PUSH">Push</option>
          <option value="SMS">SMS</option>
        </select>
        <button className="btn" onClick={send} disabled={busy || !dsl || !title || !body}>إرسال</button>
      </div>
      <textarea className="input" placeholder="المحتوى" style={{minHeight:140}} value={body} onChange={e=> setBody(e.target.value)} />
    </div>
  );
}

