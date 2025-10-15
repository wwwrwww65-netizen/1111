"use client";
import React from "react";

export default function VariantsMatrixPage(): JSX.Element {
  const [productId, setProductId] = React.useState("");
  const [variants, setVariants] = React.useState<Array<any>>([]);
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1500); };

  async function load(){
    if (!productId.trim()) return;
    try{
      setBusy(true);
      const j = await (await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, { credentials:'include' })).json();
      const list = Array.isArray(j?.product?.variants)? j.product.variants : [];
      setVariants(list.map((v:any)=> ({ id:v.id, name:v.name||'', value:v.value||'', sku:v.sku||'', price:v.price||0, purchasePrice:v.purchasePrice||0, stockQuantity:v.stockQuantity||0 })));
    }catch{}
    finally{ setBusy(false); }
  }

  async function save(){
    if (!productId.trim()) return;
    try{
      setBusy(true);
      await fetch(`/api/admin/products/${encodeURIComponent(productId)}/variants/bulk`, { method:'POST', credentials:'include', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ variants }) });
      showToast('تم الحفظ');
    }catch{ showToast('فشل الحفظ'); }
    finally{ setBusy(false); }
  }

  const set = (i:number, key:string, val:any)=> setVariants(v => v.map((x,idx)=> idx===i? { ...x, [key]: val } : x));
  const addRow = ()=> setVariants(v=> ([ ...v, { id:'', name:'', value:'', sku:'', price:0, purchasePrice:0, stockQuantity:0 } ]));
  const removeRow = (i:number)=> setVariants(v=> v.filter((_,idx)=> idx!==i));

  return (
    <main className="panel">
      <h1>مصفوفة المتغيرات</h1>
      <section style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <input value={productId} onChange={(e)=> setProductId(e.target.value)} placeholder="ID المنتج" />
          <button onClick={load} disabled={busy} className="btn btn-outline">تحميل</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>ID</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>الاسم</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>القيمة</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>SKU</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>السعر</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>سعر الشراء</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}>المخزون</th>
                <th style={{ textAlign:'right', borderBottom:'1px solid #1c2333', padding:8 }}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v:any,i:number)=> (
                <tr key={i}>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}>{v.id||'-'}</td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input value={v.name} onChange={(e)=> set(i,'name',e.target.value)} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input value={v.value} onChange={(e)=> set(i,'value',e.target.value)} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input value={v.sku} onChange={(e)=> set(i,'sku',e.target.value)} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input type="number" value={v.price} onChange={(e)=> set(i,'price',Number(e.target.value||0))} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input type="number" value={v.purchasePrice} onChange={(e)=> set(i,'purchasePrice',Number(e.target.value||0))} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><input type="number" value={v.stockQuantity} onChange={(e)=> set(i,'stockQuantity',Number(e.target.value||0))} /></td>
                  <td style={{ padding:8, borderBottom:'1px solid #1c2333' }}><button onClick={()=> removeRow(i)} className="btn btn-outline">حذف</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={addRow} className="btn btn-outline">سطر جديد</button>
          <button onClick={save} disabled={busy || !productId} className="btn">حفظ</button>
          {toast && <span>{toast}</span>}
        </div>
      </section>
    </main>
  );
}


