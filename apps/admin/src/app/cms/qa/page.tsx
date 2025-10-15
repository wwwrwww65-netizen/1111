"use client";
import React from "react";

export default function ProductQAPage(): JSX.Element {
  const [productId, setProductId] = React.useState("");
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };

  async function load(){
    setBusy(true);
    try{ const url = new URL(`/api/admin/qa/list`, window.location.origin); if (productId) url.searchParams.set('productId', productId); const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setRows(j.items||[]); }catch{}
    setBusy(false);
  }
  React.useEffect(()=>{ load(); }, []);

  async function answer(id:string, text:string){ try{ await fetch(`/api/admin/qa/answer`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ id, answer: text }) }); showToast('تم الحفظ'); await load(); }catch{ showToast('فشل'); } }
  async function approve(id:string, on:boolean){ try{ await fetch(`/api/admin/qa/approve`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ id, on }) }); await load(); }catch{} }

  return (
    <main className="panel">
      <h1>أسئلة وأجوبة المنتج</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <input value={productId} onChange={(e)=> setProductId(e.target.value)} placeholder="ID المنتج" />
        <button onClick={load} className="btn btn-outline" disabled={busy}>تحميل</button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>السؤال</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الإجابة</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الحالة</th>
              <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r:any)=> (
              <tr key={r.id}>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{r.question}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                  <InlineEdit value={r.answer||''} onSave={(text)=> answer(r.id, text)} />
                </td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{r.isApproved? 'مقبول':'معلق'}</td>
                <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>
                  <button className="btn" onClick={()=> approve(r.id, !r.isApproved)}>{r.isApproved? 'تعليق':'قبول'}</button>
                </td>
              </tr>
            ))}
            {!rows.length && (<tr><td colSpan={4} style={{ padding:12 }}>{busy? 'جارٍ التحميل…':'لا توجد أسئلة'}</td></tr>)}
          </tbody>
        </table>
      </div>
      {toast && <div>{toast}</div>}
    </main>
  );
}

function InlineEdit({ value, onSave }:{ value:string; onSave:(v:string)=>void }): JSX.Element {
  const [text, setText] = React.useState(value||'');
  return (
    <div style={{ display:'flex', gap:6 }}>
      <input value={text} onChange={(e)=> setText(e.target.value)} placeholder="أدخل الإجابة" />
      <button onClick={()=> onSave(text)} className="btn btn-outline">حفظ</button>
    </div>
  );
}


