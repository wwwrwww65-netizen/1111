"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> resolveApiBase(), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
}

type Perm = { id:string; key:string; description?:string };
type Role = { id:string; name:string; permissions: Array<{ id:string; key:string }> };

export default function RBACPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [perms, setPerms] = React.useState<Perm[]>([]);
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const show = (m:string)=> { setToast(m); setTimeout(()=> setToast(""), 1600); };

  async function load(){
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        fetch(`/api/admin/permissions`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()),
        fetch(`/api/admin/roles`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()),
      ]);
      setPerms((p.permissions||[]) as Perm[]);
      setRoles((r.roles||[]) as Role[]);
    } catch {
      setPerms([]); setRoles([]);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, [apiBase]);

  function isChecked(role: Role, permKey: string): boolean {
    return !!role.permissions?.some(p=> p.key===permKey);
  }

  async function toggle(role: Role, permKey: string, checked: boolean){
    if (busy) return; setBusy(true);
    try {
      const permIds = new Set<string>(role.permissions?.map(p=> p.id)||[]);
      const perm = perms.find(p=> p.key===permKey);
      if (!perm) return;
      if (checked) permIds.add(perm.id); else permIds.delete(perm.id);
      const res = await fetch(`/api/admin/roles/${role.id}/permissions`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ permissionIds: Array.from(permIds) }) });
      if (!res.ok) { show('فشل الحفظ'); return; }
      await load(); show('تم الحفظ');
    } finally { setBusy(false); }
  }

  async function addRole(){
    const name = prompt('اسم الدور:')||''; if (!name.trim()) return;
    const r = await fetch(`/api/admin/roles`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ name }) });
    if (!r.ok) { show('فشل إنشاء الدور'); return; }
    await load(); show('تم إنشاء الدور');
  }

  return (
    <main style={{ padding:16, width:'100%' }}>
      <h1 style={{ marginBottom:12, fontSize:22, fontWeight:800 }}>الأدوار والصلاحيات</h1>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={addRole} className="btn">إضافة دور</button>
        <button onClick={()=> load()} className="btn btn-outline">تحديث</button>
      </div>
      {loading ? (
        <div className="skeleton-table-row" />
      ) : (!perms.length || !roles.length) ? (
        <div className="empty-state">لا توجد بيانات كافية لعرض المصفوفة.</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table className="table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>الصلاحية</th>
                {roles.map(r=> (<th key={r.id}>{r.name}</th>))}
              </tr>
            </thead>
            <tbody>
              {perms.map(pm=> (
                <tr key={pm.id}>
                  <td>
                    <div style={{ display:'grid' }}>
                      <strong>{pm.key}</strong>
                      {pm.description && <span style={{ color:'var(--sub)', fontSize:12 }}>{pm.description}</span>}
                    </div>
                  </td>
                  {roles.map(r=> (
                    <td key={`${r.id}:${pm.id}`}>
                      <input type="checkbox" checked={isChecked(r, pm.key)} onChange={(e)=> toggle(r, pm.key, e.currentTarget.checked)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

