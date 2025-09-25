"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
import PermissionsTab from './PermissionsTab';
import { Tabs, Toolbar } from '../components/Ui';
import { ResponsiveTable, FilterBar } from '../components/Mobile';
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

export default function UsersPage(): JSX.Element {
  const apiBase = useApiBase();
  const authHeaders = useAuthHeaders();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [roleName, setRoleName] = React.useState("MANAGER");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [tab, setTab] = React.useState<'users'|'vendors'|'admins'|'permissions'>('users');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1800); };

  async function load() {
    const url = new URL(`${apiBase}/api/admin/users/list`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "20");
    if (search) url.searchParams.set("search", search);
    if (tab==='admins') url.searchParams.set('role','ADMIN');
    else if (tab==='users') url.searchParams.set('role','USER');
    else if (tab==='vendors') url.searchParams.set('role','VENDOR');
    const res = await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
    const json = await res.json();
    setRows(json.users || []);
  }
  React.useEffect(()=>{ if (tab!=='permissions') load(); }, [page, apiBase, tab, search]);

  async function assign(userId: string) {
    await fetch(`${apiBase}/api/admin/users/assign-role`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ userId, roleName }) });
    await load();
  }
  async function bulkAssign() {
    const ids = rows.filter(r=>selected[r.id]).map(r=>r.id);
    for (const id of ids) await assign(id);
  }

  return (
    <main className="panel" style={{ padding:16 }}>
      {toast && (<div className="toast">{toast}</div>)}

      <Tabs value={tab} onChange={(v)=>{ setTab(v as any); setPage(1); }} items={[
        { key:'users', label:'المستخدمون' },
        { key:'vendors', label:'المورّدون' },
        { key:'admins', label:'الإدارة' },
        { key:'permissions', label:'الصلاحيات' },
      ]} />

      {tab !== 'permissions' && (
        <Toolbar left={<>
          <div className="search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/البريد/الهاتف" className="input" /></div>
          <button onClick={()=>{ setPage(1); load(); }} className="btn btn-outline">بحث</button>
        </>} right={<>
          <button onClick={()=> setModalOpen(true)} className="btn">إضافة حساب</button>
        </>} />
      )}

      {tab !== 'permissions' && (
        <ResponsiveTable
          items={rows}
          isLoading={false}
          columns={[
            { key:'email', title:'البريد', minWidth:200 },
            { key:'name', title:'الاسم', minWidth:160 },
            { key:'phone', title:'الهاتف', minWidth:140 },
            { key:'role', title:'الدور', minWidth:120 },
            { key:'actions', title:'إجراءات', minWidth:200 },
          ]}
          renderCard={(u:any)=> (
            <div style={{ display:'grid', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700 }}>{u.name||'-'}</div>
                <span className="badge">{u.role}</span>
              </div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{u.email}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{u.phone||'-'}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <select value={roleName} onChange={(e)=>setRoleName(e.target.value)} className="select">
                  <option value="MANAGER">MANAGER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <button onClick={()=>assign(u.id)} className="btn btn-sm">إسناد</button>
              </div>
            </div>
          )}
          renderRow={(u:any)=> (
            <>
              <td>{u.email}</td>
              <td>{u.name}</td>
              <td>{u.phone||'-'}</td>
              <td>{u.role}</td>
              <td>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <select value={roleName} onChange={(e)=>setRoleName(e.target.value)} className="select">
                    <option value="MANAGER">MANAGER</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button onClick={()=>assign(u.id)} className="btn btn-outline">إسناد</button>
                  <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/users/${u.id}`, { method:'DELETE', credentials:'include', headers:{ ...authHeaders() } }); await load(); }} className="btn danger">حذف</button>
                </div>
              </td>
            </>
          )}
        />
      )}

      {tab !== 'permissions' && (
        <div className="pagination" style={{ marginTop:12 }}>
          <button onClick={bulkAssign} className="btn">إسناد جماعي</button>
          <button onClick={async ()=>{ const ids = rows.filter(r=>selected[r.id]).map(r=>r.id); if (!ids.length) return; const r = await fetch(`${apiBase}/api/admin/users/bulk-delete`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids }) }); if (r.ok) { setSelected({}); await load(); } else { try{ const j=await r.json(); alert(j?.error||'فشل الحذف'); } catch { alert('فشل الحذف'); } } }} className="btn danger">حذف المحدد</button>
        </div>
      )}

      {tab==='permissions' && <PermissionsTab apiBase={apiBase} authHeaders={authHeaders} />}

      {modalOpen && tab!=='permissions' && (
        <div className="modal">
          <div className="dialog">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 className="title">إضافة حساب</h3>
              <button onClick={()=> setModalOpen(false)} className="icon-btn">إغلاق</button>
            </div>
            {tab==='vendors' ? <VendorAccountForm onDone={async ()=>{ setModalOpen(false); showToast('تمت الإضافة'); await load(); }} apiBase={apiBase} authHeaders={authHeaders} /> : <GenericAccountForm role={tab==='admins' ? 'ADMIN' : 'USER'} onDone={async ()=>{ setModalOpen(false); showToast('تمت الإضافة'); await load(); }} apiBase={apiBase} authHeaders={authHeaders} />}
          </div>
        </div>
      )}
    </main>
  );
}

function GenericAccountForm({ role, onDone, apiBase, authHeaders }: { role:'USER'|'ADMIN'; onDone: ()=>Promise<void>|void; apiBase:string; authHeaders:()=>Record<string,string> }){
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [roleSearch, setRoleSearch] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const roleOptions = React.useMemo(()=> [{value:'USER',label:'USER'}, {value:'ADMIN',label:'ADMIN'}].filter(r=> !roleSearch || r.label.toLowerCase().includes(roleSearch.toLowerCase())), [roleSearch]);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/admin/users`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ name, phone, role, email, username, address, password }) });
      if (!res.ok) {
        let msg = 'تعذّر إنشاء الحساب';
        try { const j = await res.json(); if (j?.error === 'required_fields') msg = 'الحقول المطلوبة مفقودة (كلمة السر + بريد/اسم مستخدم/هاتف)'; else if (j?.message) msg = j.message; } catch {}
        setError(msg);
        return;
      }
      setName(''); setPhone(''); setEmail(''); setUsername(''); setAddress(''); setPassword('');
      await onDone();
    } finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} style={{ display:'grid', gap:10 }}>
      {error && (<div className="alert-error">{error}</div>)}
      <label>الاسم<input value={name} onChange={(e)=>setName(e.target.value)} className="input" /></label>
      <label>رقم الهاتف<input value={phone} onChange={(e)=>setPhone(e.target.value)} className="input" /></label>
      <label>البريد أو اسم المستخدم<input autoComplete="username email" value={email||username} onChange={(e)=>{ setEmail(e.target.value); setUsername(e.target.value); }} className="input" /></label>
      <label>العنوان (الموقع داخل المدينة)<input autoComplete="street-address" value={address} onChange={(e)=>setAddress(e.target.value)} className="input" /></label>
      <label>كلمة السر<input autoComplete="new-password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="input" /></label>
      <div>
        <div style={{ marginBottom:6, color:'#9ca3af' }}>نوع الحساب</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:8 }}>
          <select value={role} onChange={(e)=>{/* role controlled by parent via prop */}} disabled className="select">
            {roleOptions.map(r=> (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
          <input placeholder="بحث نوع الحساب" value={roleSearch} onChange={(e)=>setRoleSearch(e.target.value)} className="input" />
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button type="submit" disabled={saving} className="btn">{saving ? 'جارٍ الإضافة...' : 'إضافة'}</button>
      </div>
    </form>
  );
}

function VendorAccountForm({ onDone, apiBase, authHeaders }: { onDone: ()=>Promise<void>|void; apiBase:string; authHeaders:()=>Record<string,string> }){
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [vendorId, setVendorId] = React.useState('');
  const [vendors, setVendors] = React.useState<Array<{id:string;name:string}>>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include', headers: { ...authHeaders() } })).json(); setVendors(j.vendors||[]);} catch{} })(); }, [apiBase]);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const payload: any = { password, vendorId };
    if (/@/.test(identifier)) payload.email = identifier; else if (/^\+?\d/.test(identifier)) payload.phone = identifier; else payload.username = identifier;
    try {
      if (!payload.vendorId) { setError('اختر مورّداً'); return; }
      if (!payload.password || !(payload.email || payload.username || payload.phone)) { setError('الحقول المطلوبة مفقودة (كلمة السر + معرف)'); return; }
      const res = await fetch(`${apiBase}/api/admin/users`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(payload) });
      if (!res.ok) {
        let msg = 'تعذّر إنشاء الحساب للمورّد';
        try { const j = await res.json(); if (j?.error === 'required_fields') msg = 'الحقول المطلوبة مفقودة (كلمة السر + معرف)'; else if (j?.message) msg = j.message; } catch {}
        setError(msg);
        return;
      }
      setIdentifier(''); setPassword(''); setVendorId('');
      await onDone();
    } finally { setSaving(false); }
  }
  return (
    <form onSubmit={submit} style={{ display:'grid', gap:10 }}>
      {error && (<div className="alert-error">{error}</div>)}
      <label>المستخدم/الهاتف<input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} className="input" /></label>
      <label>كلمة السر<input autoComplete="new-password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="input" /></label>
      <label>المورّد
        <select value={vendorId} onChange={(e)=>setVendorId(e.target.value)} className="select">
          <option value="">اختر مورّداً</option>
          {vendors.map(v=> (<option key={v.id} value={v.id}>{v.name}</option>))}
        </select>
      </label>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button type="submit" disabled={saving} className="btn">{saving ? 'جارٍ الإضافة...' : 'إضافة'}</button>
      </div>
    </form>
  );
}

