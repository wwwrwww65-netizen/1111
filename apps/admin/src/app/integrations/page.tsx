"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function IntegrationsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [provider, setProvider] = React.useState("");
  const [config, setConfig] = React.useState("{\"enabled\":true}");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' }).then(r=>r.json()).then(j=>setRows(j.integrations||[])); },[apiBase]);
  async function add() {
    await fetch(`${apiBase}/api/admin/integrations`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ provider, config: JSON.parse(config) }) });
    setProvider(""); setConfig("{\"enabled\":true}");
    const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json(); setRows(j.integrations||[]);
  }
  async function remove(id: string){ await fetch(`${apiBase}/api/admin/integrations/${id}`, { method:'DELETE', credentials:'include' }); setRows(rows=>rows.filter(r=>r.id!==id)); }
  async function toggle(id: string, enabled: boolean){ await fetch(`${apiBase}/api/admin/integrations/${id}/toggle`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ enabled }) }); const j = await (await fetch(`${apiBase}/api/admin/integrations/list`, { credentials:'include' })).json(); setRows(j.integrations||[]); }
  async function test(provider: string, cfg: any){ await fetch(`${apiBase}/api/admin/integrations/test`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ provider, config: cfg }) }); alert('تم الاختبار'); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>التكاملات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, marginBottom:12 }}>
        <input value={provider} onChange={(e)=>setProvider(e.target.value)} placeholder="المزوّد (مثال: stripe, mada, mailgun, whatsapp)" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <input value={config} onChange={(e)=>setConfig(e.target.value)} placeholder='{"enabled":true,"apiKey":"..."}' style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={add} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>إضافة</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', padding:8 }}>المزوّد</th>
            <th style={{ textAlign:'right', padding:8 }}>مفعّل</th>
            <th style={{ textAlign:'right', padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i)=>{
            const enabled = Boolean(i.config?.enabled);
            return (
            <tr key={i.id} style={{ borderTop:'1px solid #1c2333' }}>
              <td style={{ padding:8 }}>{i.provider}</td>
              <td style={{ padding:8 }}>{enabled? 'نعم' : 'لا'}</td>
              <td style={{ padding:8, display:'flex', gap:8 }}>
                <button onClick={()=>toggle(i.id, !enabled)} className="btn btn-outline">{enabled? 'تعطيل' : 'تفعيل'}</button>
                <button onClick={()=>test(i.provider, i.config)} className="btn">اختبار</button>
                <button onClick={()=>remove(i.id)} className="btn btn-danger">حذف</button>
              </td>
            </tr>)
          })}
        </tbody>
      </table>
    </main>
  );
}

