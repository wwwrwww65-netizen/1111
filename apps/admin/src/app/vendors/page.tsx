"use client";
import React from "react";
import { ResponsiveTable, FilterBar, FormGrid, ActionBarMobile } from "../components/Mobile";
import { resolveApiBase } from "../lib/apiBase";
export const dynamic = 'force-dynamic';

export default function VendorsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [storeNumber, setStoreNumber] = React.useState("");
  const [vendorCode, setVendorCode] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [visibleCols, setVisibleCols] = React.useState<{email:boolean;phone:boolean;code:boolean}>({ email:true, phone:true, code:true });
  const [sortBy, setSortBy] = React.useState<'name'|'contactEmail'|'phone'|'vendorCode'>('name');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('asc');
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m: string) => { setToast(m); setTimeout(()=> setToast(""), 1800); };
  const [busy, setBusy] = React.useState(false);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  React.useEffect(()=>{ setLoading(true); fetch(`/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } }).then(async r=>{ if(!r.ok) throw new Error('load_failed'); return r.json(); }).then(j=>setRows(j.vendors||[])).catch((e)=>{ console.error('vendors_list_failed', e); setRows([]); }).finally(()=> setLoading(false)); },[]);
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const normalized = {
      name: name?.trim(),
      contactEmail: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      storeName: storeName?.trim() || null,
      storeNumber: storeNumber?.trim() || null,
      vendorCode: vendorCode?.trim() ? vendorCode.trim().toUpperCase() : null,
      };
      if (!normalized.name) { showToast('الاسم مطلوب'); return; }
      const res = await fetch(`/api/admin/vendors`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(normalized) });
      if (!res.ok) {
        let err = 'فشل حفظ المورد';
        try { const j = await res.json(); if (j?.error === 'vendor_code_or_name_exists') err = 'الاسم أو رمز المورد موجود مسبقاً'; else if (j?.message) err = j.message; } catch {}
        showToast(err);
        return;
      }
      setName(""); setEmail(""); setPhone(""); setAddress(""); setStoreName(""); setStoreNumber(""); setVendorCode("");
      const listRes = await fetch(`/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
      if (!listRes.ok) { showToast('فشل تحديث القائمة'); return; }
      const j = await listRes.json(); setRows(j.vendors||[]);
      showToast('تمت الإضافة');
    } catch (e:any) {
      console.error('vendor_save_error', e);
      showToast('خطأ غير متوقع');
    } finally { setBusy(false); }
  }
  return (
    <main className="panel" style={{ padding:16 }}>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}
      <h1 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>المورّدون</h1>
      <section className="panel" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إضافة مورد جديد</h2>
          <FilterBar value={search} onChange={setSearch} />
        </div>
        <FormGrid>
          <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="الاسم" />
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="البريد" />
          <input className="input" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="الهاتف" />
          <input className="input" value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="العنوان" />
          <input className="input" value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="اسم المتجر" />
          <input className="input" value={storeNumber} onChange={(e)=>setStoreNumber(e.target.value)} placeholder="رقم المتجر" />
          <input className="input" value={vendorCode} onChange={(e)=>setVendorCode(e.target.value)} placeholder="رمز المورد (SKU prefix)" />
        </FormGrid>
        <ActionBarMobile>
          <button onClick={save} disabled={busy} className="btn">{busy? 'جارٍ الحفظ...' : 'إضافة'}</button>
        </ActionBarMobile>
      </section>
      <section className="panel">
        <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8, justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={visibleCols.email} onChange={(e)=> setVisibleCols(v=> ({ ...v, email: e.currentTarget.checked }))} /> بريد</label>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={visibleCols.phone} onChange={(e)=> setVisibleCols(v=> ({ ...v, phone: e.currentTarget.checked }))} /> هاتف</label>
          <label style={{ display:'flex', alignItems:'center', gap:6 }}><input type="checkbox" checked={visibleCols.code} onChange={(e)=> setVisibleCols(v=> ({ ...v, code: e.currentTarget.checked }))} /> كود</label>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
              let ok = false;
              try {
                const r = await fetch(`/api/admin/vendors/bulk-delete`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids }) });
                ok = r.ok;
              } catch {}
              if (!ok) {
                for (const id of ids) { try { await fetch(`/api/admin/vendors/${id}`, { method:'DELETE', credentials:'include', headers:{ ...authHeaders() } }); } catch {} }
                ok = true;
              }
              if (ok) { setSelected({}); setAllChecked(false); showToast('تم حذف المحدد'); const listRes = await fetch(`/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } }); const j = await listRes.json(); setRows(j.vendors||[]); }
            }}>حذف المحدد</button>
            <div style={{ color:'var(--sub)', fontSize:12 }}>{rows.length} نتيجة</div>
          </div>
        </div>
        <ResponsiveTable
          items={rows.filter((v)=> !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.vendorCode?.toLowerCase().includes(search.toLowerCase()))}
          isLoading={loading}
          columns={[
            { key:'_sel', title:(<input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(v=> [v.id, v]))); }} />), minWidth:40 },
            { key:'name', title:'الاسم', minWidth:200 },
            ...(visibleCols.email ? [{ key:'contactEmail', title:'البريد', minWidth:200 }] : [] as any),
            ...(visibleCols.phone ? [{ key:'phone', title:'الهاتف', minWidth:140 }] : [] as any),
            ...(visibleCols.code ? [{ key:'vendorCode', title:'الكود', minWidth:120 }] : [] as any),
            { key:'actions', title:'إجراءات', minWidth:140 },
          ]}
          renderCard={(v:any)=> (
            <div style={{ display:'grid', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontWeight:700 }}>{v.name}</div>
                <span className="badge">{v.vendorCode||'NO-CODE'}</span>
              </div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{v.contactEmail||'-'}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{v.phone||'-'}</div>
              <div style={{ display:'flex', gap:6 }}>
                <a className="btn btn-sm" href={`/vendors/${v.id}`}>عرض</a>
                <button className="btn btn-sm danger" onClick={async ()=>{ await fetch(`/api/admin/vendors/${v.id}`, { method:'DELETE', credentials:'include', headers:{ ...authHeaders() } }); showToast('تم الحذف'); const listRes = await fetch(`/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } }); const j = await listRes.json(); setRows(j.vendors||[]); }}>حذف</button>
              </div>
            </div>
          )}
          renderRow={(v:any)=> (
            <>
              <td><input type="checkbox" checked={!!selected[v.id]} onChange={()=> setSelected(s=> ({...s, [v.id]: !s[v.id]}))} /></td>
              <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><span className="badge">{v.vendorCode||'NO-CODE'}</span><span>{v.name}</span></div></td>
              {visibleCols.email && (<td>{v.contactEmail||'-'}</td>)}
              {visibleCols.phone && (<td>{v.phone||'-'}</td>)}
              {visibleCols.code && (<td>{v.vendorCode||'-'}</td>)}
              <td><div style={{ display:'flex', gap:6 }}><a className="btn btn-sm" href={`/vendors/${v.id}`}>عرض</a><button className="btn btn-sm danger" onClick={async ()=>{ await fetch(`/api/admin/vendors/${v.id}`, { method:'DELETE', credentials:'include', headers:{ ...authHeaders() } }); showToast('تم الحذف'); const listRes = await fetch(`/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } }); const j = await listRes.json(); setRows(j.vendors||[]); }}>حذف</button></div></td>
            </>
          )}
        />
      </section>
    </main>
  );
}

