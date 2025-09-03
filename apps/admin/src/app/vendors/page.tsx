"use client";
import React from "react";
export const dynamic = 'force-dynamic';

export default function VendorsPage(): JSX.Element {
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [storeName, setStoreName] = React.useState("");
  const [storeNumber, setStoreNumber] = React.useState("");
  const [vendorCode, setVendorCode] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m: string) => { setToast(m); setTimeout(()=> setToast(""), 1800); };
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } }).then(async r=>{ if(!r.ok) throw new Error('load_failed'); return r.json(); }).then(j=>setRows(j.vendors||[])).catch(()=>setRows([])); },[apiBase]);
  async function save() {
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
    const res = await fetch(`${apiBase}/api/admin/vendors`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(normalized) });
    if (!res.ok) { showToast('فشل حفظ المورد'); return; }
    setName(""); setEmail(""); setPhone(""); setAddress(""); setStoreName(""); setStoreNumber(""); setVendorCode("");
    const listRes = await fetch(`${apiBase}/api/admin/vendors/list`, { credentials:'include', cache:'no-store', headers: { ...authHeaders() } });
    if (!listRes.ok) { showToast('فشل تحديث القائمة'); return; }
    const j = await listRes.json(); setRows(j.vendors||[]);
    showToast('تمت الإضافة');
  }
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      {toast && (<div style={{ marginBottom:8, background:'#111827', color:'#e5e7eb', padding:'6px 10px', borderRadius:8 }}>{toast}</div>)}
      <h1 style={{ marginBottom: 16, fontSize: 22, fontWeight: 700 }}>المورّدون</h1>
      <section style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>إضافة مورد جديد</h2>
          <div style={{ display:'flex', gap:8 }}>
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/الكود" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0', width:220 }} />
            <button onClick={()=>{ /* optional client-side filter */ }} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>بحث</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="الاسم" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="البريد" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="الهاتف" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="العنوان" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0', gridColumn:'1 / -1' }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input value={storeName} onChange={(e)=>setStoreName(e.target.value)} placeholder="اسم المتجر" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={storeNumber} onChange={(e)=>setStoreNumber(e.target.value)} placeholder="رقم المتجر" style={{ padding:10, borderRadius:10, background:'#0f1320', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <input value={vendorCode} onChange={(e)=>setVendorCode(e.target.value)} placeholder="رمز المورد (SKU prefix)" style={{ padding:10, borderRadius:10, background:'#0f1320', border:"1px solid #1c2333", color:'#e2e8f0' }} />
            <button onClick={save} style={{ padding:'10px 14px', background:'#800020', color:'#fff', borderRadius:10 }}>إضافة</button>
          </div>
        </div>
      </section>
      <section style={{ background: '#0b0e14', border: '1px solid #1c2333', borderRadius: 12, padding: 12, marginTop: 16 }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
          <thead>
            <tr>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الاسم</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>البريد</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الهاتف</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>الكود</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:12, background:'#0f1320' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((v)=> !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.vendorCode?.toLowerCase().includes(search.toLowerCase()))
              .map((v, idx)=> (
              <tr key={v.id} style={{ background: idx % 2 ? '#0a0e17' : 'transparent' }}>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ padding:'2px 8px', background:'#111827', borderRadius:999, fontSize:12, color:'#9ca3af' }}>{v.vendorCode||'NO-CODE'}</span>
                    <span>{v.name}</span>
                  </div>
                </td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.contactEmail||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.phone||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>{v.vendorCode||'-'}</td>
                <td style={{ padding:12, borderBottom:'1px solid #1c2333' }}>
                  <a href={`/vendors/${v.id}`} style={{ padding:'8px 12px', background:'#374151', color:'#e5e7eb', borderRadius:8, textDecoration:'none' }}>عرض</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

