"use client";
import React from 'react';
import { resolveApiBase } from '../../../lib/apiBase';
import { FilterBar } from '../../../components/Mobile';
import { ActionBarMobile, FormGrid } from '../../../components/Mobile';

type Role = { id:string; name:string; permissions?:string[] };

export default function MobileRBAC(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{ name:string }>({ name:'' });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const u = new URL(`${resolveApiBase()}/api/admin/settings/roles`);
      if (q.trim()) u.searchParams.set('q', q.trim());
      const r = await fetch(u.toString(), { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setRoles(j.roles||[]);
    }catch{ setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  }, [q]);

  React.useEffect(()=>{ const t = setTimeout(load, 300); return ()=> clearTimeout(t); }, [load]);

  async function save(e: React.FormEvent){
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try{
      const r = await fetch(`${resolveApiBase()}/api/admin/settings/roles`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify(form) });
      if(!r.ok) throw new Error('failed');
      setForm({ name:'' });
      await load();
    }catch{ /* noop */ }
    finally{ setSaving(false); }
  }

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>الأدوار والصلاحيات</div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {!loading && !error && roles.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا توجد أدوار</div>}
      {!loading && !error && roles.map((r)=> (
        <div key={r.id} className="panel">
          <div style={{ fontWeight:700 }}>{r.name}</div>
          {Array.isArray(r.permissions) && r.permissions.length>0 && (
            <div style={{ color:'var(--sub)', fontSize:12, marginTop:4 }}>{r.permissions.slice(0,5).join('، ')}{r.permissions.length>5?'…':''}</div>
          )}
        </div>
      ))}
      <form onSubmit={save} className="panel">
        <div style={{ fontWeight:800, marginBottom:8 }}>إضافة دور</div>
        <FormGrid>
          <label>
            <div style={{ marginBottom:6 }}>الاسم</div>
            <input className="input" value={form.name} onChange={e=> setForm({ name:e.target.value })} placeholder="اسم الدور" />
          </label>
        </FormGrid>
        <ActionBarMobile>
          <button type="button" className="btn btn-outline" onClick={()=> setForm({ name:'' })}>إلغاء</button>
          <button type="submit" className="btn" disabled={saving}>حفظ</button>
        </ActionBarMobile>
      </form>
    </div>
  );
}

