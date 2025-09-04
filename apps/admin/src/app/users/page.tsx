"use client";
import React from "react";
export const dynamic = 'force-dynamic';

function useApiBase(){
  return React.useMemo(()=> (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window!=="undefined" ? window.location.origin.replace('jeeey-manger','jeeeyai') : 'http://localhost:4000'), []);
}
function useAuthHeaders(){
  return React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
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
  const [tab, setTab] = React.useState<'users'|'vendors'|'admins'>('users');
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
  React.useEffect(()=>{ load(); }, [page, apiBase]);

  async function assign(userId: string) {
    await fetch(`${apiBase}/api/admin/users/assign-role`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ userId, roleName }) });
    await load();
  }
  async function bulkAssign() {
    const ids = rows.filter(r=>selected[r.id]).map(r=>r.id);
    for (const id of ids) await assign(id);
  }

  return (
    <main style={{ padding: 16 }}>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}
      <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
        <button onClick={()=>{ setTab('users'); setPage(1); load(); }} style={{ padding:'8px 14px', borderRadius:999, background: tab==='users' ? '#800020':'#111827', color:'#e5e7eb', border:'1px solid #1c2333' }}>المستخدمون</button>
        <button onClick={()=>{ setTab('vendors'); setPage(1); load(); }} style={{ padding:'8px 14px', borderRadius:999, background: tab==='vendors' ? '#800020':'#111827', color:'#e5e7eb', border:'1px solid #1c2333' }}>المورّدون</button>
        <button onClick={()=>{ setTab('admins'); setPage(1); load(); }} style={{ padding:'8px 14px', borderRadius:999, background: tab==='admins' ? '#800020':'#111827', color:'#e5e7eb', border:'1px solid #1c2333' }}>الإدارة</button>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/البريد/الهاتف" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
          <button onClick={()=>{ setPage(1); load(); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
        </div>
        <button onClick={()=> setModalOpen(true)} style={{ padding:'8px 12px', background:'#800020', color:'#fff', borderRadius:8 }}>إضافة حساب</button>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <select value={roleName} onChange={(e)=>setRoleName(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="MANAGER">MANAGER</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}></th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>البريد</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الاسم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الهاتف</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الدور</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u)=> (
            <tr key={u.id}>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}><input type="checkbox" checked={!!selected[u.id]} onChange={()=>setSelected(s=>({...s,[u.id]:!s[u.id]}))} /></td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{u.email}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{u.name}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{u.phone||'-'}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{u.role}</td>
              <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                <button onClick={()=>assign(u.id)} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>إسناد {roleName}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop:12 }}>
        <button onClick={bulkAssign} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>إسناد جماعي</button>
      </div>
      {modalOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:50 }}>
          <div style={{ width:520, background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ margin:0 }}>إضافة حساب</h3>
              <button onClick={()=> setModalOpen(false)} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>إغلاق</button>
            </div>
            {tab==='vendors' ? <VendorAccountForm onDone={async ()=>{ setModalOpen(false); showToast('تمت الإضافة'); await load(); }} apiBase={apiBase} authHeaders={authHeaders} /> : <GenericAccountForm role={tab==='admins' ? 'ADMIN' : 'USER'} onDone={async ()=>{ setModalOpen(false); showToast('تمت الإضافة'); await load(); }} apiBase={apiBase} authHeaders={authHeaders} />}
          </div>
        </div>
      )}
    </main>
  );
}

// legacy placeholder removed

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
      {error && (<div style={{ background:'#7f1d1d', color:'#fee2e2', padding:'8px 10px', borderRadius:8 }}>{error}</div>)}
      <label>الاسم<input value={name} onChange={(e)=>setName(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>رقم الهاتف<input value={phone} onChange={(e)=>setPhone(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>البريد أو اسم المستخدم<input value={email||username} onChange={(e)=>{ setEmail(e.target.value); setUsername(e.target.value); }} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>العنوان (الموقع داخل المدينة)<input value={address} onChange={(e)=>setAddress(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>كلمة السر<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <div>
        <div style={{ marginBottom:6, color:'#9ca3af' }}>نوع الحساب</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:8 }}>
          <select value={role} onChange={(e)=>{/* role controlled by parent via prop */}} disabled style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
            {roleOptions.map(r=> (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
          <input placeholder="بحث نوع الحساب" value={roleSearch} onChange={(e)=>setRoleSearch(e.target.value)} style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button type="submit" disabled={saving} style={{ padding:'8px 12px', background: saving ? '#4b5563' : '#800020', color:'#fff', borderRadius:8 }}>{saving ? 'جارٍ الإضافة...' : 'إضافة'}</button>
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
      {error && (<div style={{ background:'#7f1d1d', color:'#fee2e2', padding:'8px 10px', borderRadius:8 }}>{error}</div>)}
      <label>المستخدم/الهاتف<input value={identifier} onChange={(e)=>setIdentifier(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>كلمة السر<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} /></label>
      <label>المورّد
        <select value={vendorId} onChange={(e)=>setVendorId(e.target.value)} style={{ width:'100%', padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="">اختر مورّداً</option>
          {vendors.map(v=> (<option key={v.id} value={v.id}>{v.name}</option>))}
        </select>
      </label>
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
        <button type="submit" disabled={saving} style={{ padding:'8px 12px', background: saving ? '#4b5563' : '#800020', color:'#fff', borderRadius:8 }}>{saving ? 'جارٍ الإضافة...' : 'إضافة'}</button>
      </div>
    </form>
  );
}

