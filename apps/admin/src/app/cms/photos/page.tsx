"use client";
import React from "react";

export default function UGCPhotosPage(): JSX.Element {
  const [productId, setProductId] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    try{ const url = new URL(`/api/admin/photos/list`, window.location.origin); if (productId) url.searchParams.set('productId', productId); const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setRows(j.items||[]); }catch{}
    setBusy(false);
  }
  React.useEffect(()=>{ load(); }, []);

  async function approve(id:string, on:boolean){ try{ await fetch(`/api/admin/photos/approve`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ id, on }) }); await load(); }catch{} }

  return (
    <main className="panel">
      <h1>صور العملاء</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={productId} onChange={(e)=> setProductId(e.target.value)} placeholder="ID المنتج" />
        <button onClick={load} className="btn btn-outline" disabled={busy}>تحميل</button>
      </div>
      <div style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {rows.map((r:any)=> (
          <div key={r.id} style={{ border:'1px solid #1c2333', borderRadius:8, overflow:'hidden' }}>
            <img src={r.url} alt="UGC" style={{ width:'100%', height:160, objectFit:'cover' }} />
            <div style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{r.isApproved? 'مقبول':'معلق'}</span>
              <button className="btn" onClick={()=> approve(r.id, !r.isApproved)}>{r.isApproved? 'تعليق':'قبول'}</button>
            </div>
          </div>
        ))}
        {!rows.length && !busy && <div style={{ opacity:0.7 }}>لا توجد صور</div>}
      </div>
    </main>
  );
}


