"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
import { trpc } from "../providers";

export default function InventoryPage(): JSX.Element {
  const q: any = trpc as any;
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const { data, isLoading, refetch } = q.admin.getProducts.useQuery({ page, limit: 20, search });
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const adjust = React.useMemo(() => (q as any).adminAdjust || null, [q]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const all = data?.products ?? [];
  const selectedIds = all.filter((p: any) => selected[p.id]).map((p: any) => p.id);

  async function bulkAdjust(delta: number) {
    for (const id of selectedIds) {
      await fetch(`${apiBase}/api/admin/inventory/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders() },
        credentials:'include',
        body: JSON.stringify({ productId: id, delta })
      });
    }
    await refetch();
  }

  function exportCSV() {
    window.open(`${apiBase}/api/admin/inventory/export/csv`, "_blank");
  }
  function exportPDF() {
    window.open(`${apiBase}/api/admin/inventory/export/pdf`, "_blank");
  }

  if (isLoading) return <main>Loading…</main>;

  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>المخزون</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم أو SKU" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        <button onClick={()=>refetch()} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
        <button onClick={()=>bulkAdjust(1)} disabled={!selectedIds.length} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>+1 للمحدد</button>
        <button onClick={()=>bulkAdjust(-1)} disabled={!selectedIds.length} style={{ padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>-1 للمحدد</button>
        <button onClick={exportCSV} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8 }}>تصدير CSV</button>
        <button onClick={exportPDF} style={{ padding:'8px 12px', background:'#1f2937', color:'#e5e7eb', borderRadius:8 }}>تصدير PDF</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}></th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الاسم</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>SKU</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المخزون</th>
            <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>تحرير</th>
          </tr>
        </thead>
        <tbody>
          {all.map((p: any) => (
            <tr key={p.id}>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <input type="checkbox" checked={!!selected[p.id]} onChange={()=>toggle(p.id)} />
              </td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.name}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.sku || '-'}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{p.stockQuantity}</td>
              <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                <InlineAdjust productId={p.id} onDone={refetch} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function InlineAdjust({ productId, onDone }: { productId: string; onDone: ()=>void }): JSX.Element {
  const [delta, setDelta] = React.useState<string>("1");
  const [undo, setUndo] = React.useState<number | null>(null);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  },[]);
  async function apply(d: number) {
    await fetch(`${apiBase}/api/admin/inventory/adjust`, { method: "POST", headers: { "content-type":"application/json", ...authHeaders() }, credentials:'include', body: JSON.stringify({ productId, delta: d }) });
    setUndo(-d);
    onDone();
  }
  async function handleUndo() {
    if (undo==null) return;
    await apply(undo);
    setUndo(null);
  }
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <input value={delta} onChange={(e)=>setDelta(e.target.value)} style={{ width:60, padding:6, borderRadius:6, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
      <button onClick={()=>apply(Number(delta)||0)} style={{ padding:'6px 10px', background:'#111827', color:'#e5e7eb', borderRadius:6 }}>تطبيق</button>
      {undo!=null && (<button onClick={handleUndo} style={{ padding:'6px 10px', background:'#7c2d12', color:'#fff', borderRadius:6 }}>تراجع</button>)}
    </div>
  );
}

// legacy placeholder removed

