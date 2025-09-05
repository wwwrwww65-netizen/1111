"use client";
import React from 'react';

export default function PermissionsTab({ apiBase, authHeaders }: { apiBase:string; authHeaders:()=>Record<string,string> }): JSX.Element {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [perms, setPerms] = React.useState<any[]>([]);
  const [roleName, setRoleName] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>('');
  const [assignUserSearch, setAssignUserSearch] = React.useState('');
  const [users, setUsers] = React.useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = React.useState<Record<string, boolean>>({});

  async function load(){
    const [r, p] = await Promise.all([
      fetch(`${apiBase}/api/admin/roles`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({roles:[]})),
      fetch(`${apiBase}/api/admin/permissions`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({permissions:[],groups:{}})),
    ]);
    setRoles(r.roles||[]); setPerms(p.permissions||[]);
  }
  React.useEffect(()=>{ load(); },[apiBase]);

  async function addRole(){ if (!roleName.trim()) return; await fetch(`${apiBase}/api/admin/roles`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ name: roleName.trim() }) }); setRoleName(''); await load(); }
  async function setRolePerms(roleId: string, permissionIds: string[]){ await fetch(`${apiBase}/api/admin/roles/${roleId}/permissions`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ permissionIds }) }); await load(); }
  async function searchUsers(){ const url = new URL(`${apiBase}/api/admin/users/list`); url.searchParams.set('page','1'); url.searchParams.set('limit','50'); if (assignUserSearch) url.searchParams.set('search', assignUserSearch); const j = await (await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setUsers(j.users||[]); setSelectedUsers({}); }
  async function assignRolesToUsers(){ if (!selectedRoleId) return; const ids = Object.entries(selectedUsers).filter(([,v])=>v).map(([k])=>k); for (const id of ids) { await fetch(`${apiBase}/api/admin/users/${id}/assign-roles`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ roleIds: [selectedRoleId] }) }); } }

  const filteredPerms = React.useMemo(()=> perms.filter((p:any)=> !search || p.key.toLowerCase().includes(search.toLowerCase())), [perms, search]);
  const currentRole = React.useMemo(()=> roles.find((r:any)=> r.id===selectedRoleId), [roles, selectedRoleId]);
  const rolePermIds = new Set((currentRole?.permissions||[]).map((p:any)=>p.id));

  return (
    <section className="panel" style={{ marginTop:16 }}>
      <h3 style={{ marginTop:0 }}>إدارة الصلاحيات</h3>
      <div className="grid" style={{ gridTemplateColumns:'1fr 2fr', gap:16 }}>
        <div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8, marginBottom:8 }}>
            <input className="input" placeholder="اسم الدور" value={roleName} onChange={(e)=>setRoleName(e.target.value)} />
            <button className="btn" onClick={addRole}>إضافة دور</button>
          </div>
          <div style={{ maxHeight:300, overflow:'auto' }}>
            {roles.map((r:any)=> (
              <div key={r.id} onClick={()=>setSelectedRoleId(r.id)} style={{ padding:10, border:'1px solid var(--muted)', borderRadius:8, marginBottom:8, background: selectedRoleId===r.id? '#101828':'transparent', cursor:'pointer' }}>{r.name}</div>
            ))}
          </div>
        </div>
        <div>
          <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8, marginBottom:8 }}>
            <input className="input" placeholder="بحث صلاحيات" value={search} onChange={(e)=>setSearch(e.target.value)} />
            <button className="icon-btn" onClick={()=>setSearch('')}>مسح</button>
          </div>
          <div style={{ maxHeight:320, overflow:'auto', border:'1px solid var(--muted)', borderRadius:8, padding:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {filteredPerms.map((p:any)=> {
                const checked = rolePermIds.has(p.id);
                return (
                  <label key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px' }}>
                    <input type="checkbox" checked={checked} onChange={(e)=>{
                      const next = new Set(rolePermIds);
                      if (e.target.checked) next.add(p.id); else next.delete(p.id);
                      setRolePerms(selectedRoleId, Array.from(next));
                    }} />
                    <span>{p.key}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ color:'var(--sub)', marginBottom:6 }}>إسناد الدور للمستخدمين</div>
            <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8, marginBottom:8 }}>
              <input className="input" placeholder="بحث مستخدمين" value={assignUserSearch} onChange={(e)=>setAssignUserSearch(e.target.value)} />
              <button className="btn" onClick={searchUsers}>بحث</button>
            </div>
            <div style={{ maxHeight:220, overflow:'auto', border:'1px solid var(--muted)', borderRadius:8 }}>
              {users.map((u:any)=> (
                <label key={u.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px' }}>
                  <input type="checkbox" checked={!!selectedUsers[u.id]} onChange={()=>setSelectedUsers(s=> ({ ...s, [u.id]: !s[u.id] }))} />
                  <span>{u.name||'-'} — {u.email}</span>
                </label>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn" onClick={assignRolesToUsers}>إسناد الدور للمختارين</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

