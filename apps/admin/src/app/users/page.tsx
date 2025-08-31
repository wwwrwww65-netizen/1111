"use client";
import React from "react";

export default function UsersPage(): JSX.Element {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [roleName, setRoleName] = React.useState("MANAGER");
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});

  async function load() {
    const url = new URL(window.location.origin + "/api/admin/users/list");
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", "20");
    if (search) url.searchParams.set("search", search);
    const res = await fetch(url.toString());
    const json = await res.json();
    setRows(json.users || []);
  }
  React.useEffect(()=>{ load(); }, [page]);

  async function assign(userId: string) {
    await fetch("/api/admin/users/assign-role", { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ userId, roleName }) });
    await load();
  }
  async function bulkAssign() {
    const ids = rows.filter(r=>selected[r.id]).map(r=>r.id);
    for (const id of ids) await assign(id);
  }

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المستخدمون</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/البريد" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>{ setPage(1); load(); }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
        <select value={roleName} onChange={(e)=>setRoleName(e.target.value)} style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }}>
          <option value="MANAGER">MANAGER</option>
          <option value="OPERATOR">OPERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}></th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>البريد</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الاسم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الدور</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u)=> (
            <tr key={u.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input type="checkbox" checked={!!selected[u.id]} onChange={()=>setSelected(s=>({...s,[u.id]:!s[u.id]}))} /></td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{u.email}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{u.name}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{u.role}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <button onClick={()=>assign(u.id)} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>إسناد {roleName}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop:12 }}>
        <button onClick={bulkAssign} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>إسناد جماعي</button>
      </div>
    </main>
  );
}

// legacy placeholder removed

