"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function NotificationRulesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rules, setRules] = React.useState<Array<{id:string;trigger:string;template:string;channel:string;enabled:boolean}>>([]);
  const [show, setShow] = React.useState(false);
  const [form, setForm] = React.useState<{trigger:string;template:string;channel:'EMAIL'|'PUSH'|'SMS';enabled:boolean}>({ trigger:'order.created', template:'', channel:'EMAIL', enabled:true });

  async function load(){
    const j = await (await fetch(`${apiBase}/api/admin/notifications/rules`, { credentials:'include' })).json();
    setRules(j.rules||[]);
  }
  React.useEffect(()=>{ load().catch(()=> setRules([])); }, [apiBase]);

  async function save(){
    const res = await fetch(`${apiBase}/api/admin/notifications/rules`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(form) });
    if (!res.ok) { alert('تعذر الحفظ'); return; }
    setShow(false); setForm({ trigger:'order.created', template:'', channel:'EMAIL', enabled:true });
    await load();
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">قواعد التنبيهات التلقائية</h1>
      <div className="toolbar">
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ إضافة قاعدة</button>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المشغل</th><th>القالب</th><th>القناة</th><th>الحالة</th></tr></thead>
        <tbody>
          {rules.map(r=> (
            <tr key={r.id}><td>{r.trigger}</td><td>{r.template}</td><td>{r.channel}</td><td>{r.enabled? 'مفعّل':'متوقف'}</td></tr>
          ))}
          {!rules.length && <tr><td colSpan={4}>لا توجد قواعد</td></tr>}
        </tbody>
      </table>

      {show && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">قاعدة جديدة</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" placeholder="المشغل (مثال: order.created)" value={form.trigger} onChange={e=> setForm(f=> ({...f, trigger: e.target.value}))} />
              <select className="input" value={form.channel} onChange={e=> setForm(f=> ({...f, channel: e.target.value as any}))}>
                <option value="EMAIL">بريد</option>
                <option value="PUSH">Push</option>
                <option value="SMS">SMS</option>
              </select>
              <input className="input" placeholder="القالب/الموضوع" value={form.template} onChange={e=> setForm(f=> ({...f, template: e.target.value}))} />
              <label style={{display:'flex',alignItems:'center', gap:6}}>
                <input type="checkbox" checked={form.enabled} onChange={e=> setForm(f=> ({...f, enabled: e.target.checked}))} />
                مفعّل
              </label>
            </div>
            <div className="mt-3" style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button className="btn btn-outline btn-sm" onClick={()=> setShow(false)}>إلغاء</button>
              <button className="btn btn-sm" onClick={save}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

