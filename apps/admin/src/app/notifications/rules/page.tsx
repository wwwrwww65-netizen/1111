"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type Rule = { id:string; trigger:string; template:string; channel:string; enabled:boolean; name?:string|null; criteria?: any; rateLimitSeconds?: number };
type Condition = { field:string; op:'eq'|'neq'|'gte'|'lte'|'contains'; value:string };

export default function NotificationRulesPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [show, setShow] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string|undefined>(undefined);
  const [form, setForm] = React.useState<{name:string; trigger:string; template:string; channel:'EMAIL'|'PUSH'|'SMS'|'WHATSAPP'; enabled:boolean; rateLimitSeconds:number; conditions: Condition[]}>({ name:'', trigger:'order.created', template:'', channel:'EMAIL', enabled:true, rateLimitSeconds:0, conditions: [] });

  async function load(){
    const j = await (await fetch(`${apiBase}/api/admin/notifications/rules`, { credentials:'include' })).json();
    setRules((j.rules||[]).map((r:any)=> ({ ...r, rateLimitSeconds: r.rateLimitSeconds??0 })));
  }
  React.useEffect(()=>{ load().catch(()=> setRules([])); }, [apiBase]);

  function buildCriteria(){
    return { conditions: form.conditions };
  }

  async function save(){
    const payload = { name: form.name||null, trigger: form.trigger, template: form.template, channel: form.channel, enabled: form.enabled, criteria: buildCriteria(), rateLimitSeconds: Number(form.rateLimitSeconds||0) };
    const url = editingId ? `${apiBase}/api/admin/notifications/rules/${encodeURIComponent(editingId)}` : `${apiBase}/api/admin/notifications/rules`;
    const method = editingId ? 'PUT':'POST';
    const res = await fetch(url, { method, credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
    if (!res.ok) { alert('تعذر الحفظ'); return; }
    setShow(false); setEditingId(undefined); setForm({ name:'', trigger:'order.created', template:'', channel:'EMAIL', enabled:true, rateLimitSeconds:0, conditions: [] });
    await load();
  }

  async function del(id:string){
    if (!confirm('حذف القاعدة؟')) return;
    await fetch(`${apiBase}/api/admin/notifications/rules/${encodeURIComponent(id)}`, { method:'DELETE', credentials:'include' });
    await load();
  }

  return (
    <div className="panel" style={{ padding:16 }}>
      <h1 className="text-xl font-bold mb-3">قواعد التنبيهات التلقائية</h1>
      <div className="toolbar" style={{ position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0' }}>
        <button className="btn btn-sm" onClick={()=> setShow(true)}>+ إضافة قاعدة</button>
      </div>
      <table className="table mt-3">
        <thead style={{ position:'sticky', top:48, zIndex:5, background:'var(--panel)'}}><tr><th>الاسم</th><th>المشغل</th><th>القالب</th><th>القناة</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          {rules.map(r=> (
            <tr key={r.id}>
              <td>{r.name||'-'}</td>
              <td>{r.trigger}</td>
              <td>{r.template}</td>
              <td>{r.channel}</td>
              <td>{r.enabled? 'مفعّل':'متوقف'}</td>
              <td style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button className="btn btn-sm" onClick={()=> { setEditingId(r.id); setForm({ name:r.name||'', trigger:r.trigger, template:r.template, channel:(r.channel?.toUpperCase?.()||'EMAIL') as any, enabled:r.enabled, rateLimitSeconds:Number(r.rateLimitSeconds||0), conditions:(r.criteria?.conditions||[]) }); setShow(true); }}>تحرير</button>
                <button className="btn btn-sm btn-outline" onClick={()=> del(r.id)}>حذف</button>
              </td>
            </tr>
          ))}
          {!rules.length && <tr><td colSpan={4}>لا توجد قواعد</td></tr>}
        </tbody>
      </table>

      {show && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">{editingId? 'تحرير قاعدة':'قاعدة جديدة'}</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <input className="input" placeholder="الاسم (اختياري)" value={form.name} onChange={e=> setForm(f=> ({...f, name: e.target.value}))} />
              <input className="input" placeholder="المشغل (مثال: order.created)" value={form.trigger} onChange={e=> setForm(f=> ({...f, trigger: e.target.value}))} />
              <select className="input" value={form.channel} onChange={e=> setForm(f=> ({...f, channel: e.target.value as any}))}>
                <option value="EMAIL">بريد</option>
                <option value="PUSH">Push</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
              <input className="input" placeholder="القالب/الموضوع" value={form.template} onChange={e=> setForm(f=> ({...f, template: e.target.value}))} />
              <label style={{display:'flex',alignItems:'center', gap:6}}>
                <input type="checkbox" checked={form.enabled} onChange={e=> setForm(f=> ({...f, enabled: e.target.checked}))} />
                مفعّل
              </label>
              <label>
                <div>حد الإرسال (ثوانٍ)</div>
                <input type="number" className="input" value={form.rateLimitSeconds} onChange={e=> setForm(f=> ({...f, rateLimitSeconds: Number(e.target.value||0)}))} />
              </label>
            </div>
            <div className="panel mt-3" style={{ padding:12 }}>
              <b className="block mb-2">معايير الإرسال</b>
              <CriteriaBuilder value={form.conditions} onChange={(conds)=> setForm(f=> ({...f, conditions: conds}))} />
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

function CriteriaBuilder({ value, onChange }: { value: Condition[]; onChange: (v: Condition[])=> void }): JSX.Element {
  const conds = value || [];
  const [field, setField] = React.useState<string>('order.status');
  const [op, setOp] = React.useState<Condition['op']>('eq');
  const [val, setVal] = React.useState<string>('PAID');
  function add(){
    if (!field || !val) return;
    onChange([ ...conds, { field, op, value: val } ]);
    setVal('');
  }
  function remove(idx:number){
    onChange(conds.filter((_,i)=> i!==idx));
  }
  return (
    <div style={{ display:'grid', gap:8 }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <select className="input" value={field} onChange={e=> setField(e.target.value)}>
          <option value="order.status">order.status</option>
          <option value="order.total">order.total</option>
          <option value="user.role">user.role</option>
          <option value="user.email">user.email</option>
        </select>
        <select className="input" value={op} onChange={e=> setOp(e.target.value as any)}>
          <option value="eq">=</option>
          <option value="neq">!=</option>
          <option value="gte">≥</option>
          <option value="lte">≤</option>
          <option value="contains">contains</option>
        </select>
        <input className="input" placeholder="القيمة" value={val} onChange={e=> setVal(e.target.value)} />
        <button className="btn btn-sm" onClick={add}>إضافة شرط</button>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {conds.map((c, idx)=> (
          <span key={idx} style={{ background:'#1f2937', padding:'4px 8px', borderRadius:999 }}>
            {c.field} {c.op} {c.value}
            <button className="btn btn-xs btn-outline" onClick={()=> remove(idx)} style={{ marginInlineStart:6 }}>إزالة</button>
          </span>
        ))}
        {!conds.length && (<span style={{ color:'#94a3b8' }}>لا شروط</span>)}
      </div>
    </div>
  );
}

