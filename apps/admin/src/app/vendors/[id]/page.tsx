"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function VendorOverviewPage({ params }: { params: { id: string } }): JSX.Element {
  const { id } = params;
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [tab, setTab] = React.useState<'info'|'products'|'orders'|'invoices'|'ledger'|'docs'| 'scorecard'>('info');
  const [data, setData] = React.useState<any>(null);
  const [ledger, setLedger] = React.useState<{ entries:any[]; balance:number }>({ entries:[], balance:0 });
  const [docs, setDocs] = React.useState<any[]>([]);
  const [amount, setAmount] = React.useState('');
  const [type, setType] = React.useState<'CREDIT'|'DEBIT'>('CREDIT');
  const [note, setNote] = React.useState('');
  const [docType, setDocType] = React.useState('Contract');
  const [docExpiry, setDocExpiry] = React.useState('');
  const [docFile, setDocFile] = React.useState('');
  const [vendorOrders, setVendorOrders] = React.useState<any[]>([]);
  const [orderLines, setOrderLines] = React.useState<any[]|null>(null);
  React.useEffect(()=>{ fetch(`/api/admin/vendors/${id}/overview`, { credentials:'include' }).then(r=>r.json()).then(setData); },[id]);
  React.useEffect(()=>{ if(tab==='orders'){ fetch(`/api/admin/vendors/${id}/orders`, { credentials:'include' }).then(r=>r.json()).then(j=> setVendorOrders(j.orders||[])); } },[id,tab]);
  React.useEffect(()=>{ if(tab==='ledger'){ fetch(`/api/admin/vendors/${id}/ledger`, { credentials:'include' }).then(r=>r.json()).then(j=> setLedger({ entries:j.entries||[], balance:j.balance||0 })); } },[id,tab]);
  React.useEffect(()=>{ if(tab==='docs'){ fetch(`/api/admin/vendors/${id}/documents`, { credentials:'include' }).then(r=>r.json()).then(j=> setDocs(j.documents||[])); } },[id,tab]);
  if (!data) return <main style={{ padding:16 }}>Loading…</main>;
  const { vendor, products, orders, invoices, stock } = data;
  return (
    <main style={{ padding:16 }}>
      <h1 style={{ marginBottom: 8 }}>المورد: {vendor.name}</h1>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span className="badge">{vendor.isActive? 'نشط' : 'معلّق'}</span>
          <span style={{ padding:'4px 8px', border:'1px solid #1c2333', borderRadius:8 }}>الرصيد: {Number(ledger.balance||0).toFixed(2)}</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-sm">إرسال رسالة</button>
          <button className="btn btn-sm" onClick={()=> setTab('ledger')}>إضافة دفعة</button>
          <button className="btn btn-sm">إنشاء PO</button>
          <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/export/pdf`}>PDF</a>
          <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/export/xls`}>Excel</a>
        </div>
      </div>
      <div style={{ display:'grid', placeItems:'center', marginBottom:12 }}>
        <div className="btn-group">
          <button className={`btn btn-sm ${tab==='info'?'':'btn-outline'}`} onClick={()=> setTab('info')}>معلومات أساسية</button>
          <button className={`btn btn-sm ${tab==='products'?'':'btn-outline'}`} onClick={()=> setTab('products')}>المنتجات والمخزون</button>
          <button className={`btn btn_sm ${tab==='orders'?'':'btn-outline'}`} onClick={()=> setTab('orders')}>الطلبات</button>
          <button className={`btn btn-sm ${tab==='invoices'?'':'btn-outline'}`} onClick={()=> setTab('invoices')}>الفواتير والمدفوعات</button>
          <button className={`btn btn-sm ${tab==='ledger'?'':'btn-outline'}`} onClick={()=> setTab('ledger')}>الحساب المالي</button>
          <button className={`btn btn-sm ${tab==='docs'?'':'btn-outline'}`} onClick={()=> setTab('docs')}>الوثائق</button>
          <button className={`btn btn-sm ${tab==='scorecard'?'':'btn-outline'}`} onClick={()=> setTab('scorecard')}>التقارير والتنبيهات</button>
        </div>
      </div>

      {tab==='info' && (
        <div className="panel" style={{ marginBottom:12, padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:8 }}>
            <div className="panel">الكود: {vendor.vendorCode||'-'}</div>
            <div className="panel">الهاتف: {vendor.phone||'-'}</div>
            <div className="panel">المخزون الإجمالي: {stock}</div>
            <div className="panel">الطلبات: {orders.length}</div>
          </div>
        </div>
      )}

      {tab==='products' && (
      <>
      <h2 style={{ margin:'12px 0' }}>منتجات المورد</h2>
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
        <input type="file" accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={async(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=async()=>{ try{ const res= await fetch(`/api/admin/vendors/${id}/catalog/upload`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ base64: String(r.result||'') }) }); if(!res.ok) alert('فشل رفع الكتالوج'); }catch{ alert('خطأ أثناء الرفع'); } }; r.readAsDataURL(f); }} />
        <button className="btn btn-sm">مزامنة الأسعار</button>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
        <thead style={{ position:'sticky', top:0, background:'var(--panel)', zIndex:1 }}><tr><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>#</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الاسم</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>SKU</th><th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>المخزون</th></tr></thead>
        <tbody>
          {products.map((p:any)=> (
            <tr key={p.id}><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.id.slice(0,6)}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.name}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.sku||'-'}</td><td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{p.stockQuantity}</td></tr>
          ))}
        </tbody>
      </table>
      </>
      )}

      {tab==='orders' && (
      <>
      <h2 style={{ margin:'12px 0' }}>طلبات المورد (PO/GRN)</h2>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/orders/export/xls`}>تصدير Excel</a>
        <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/orders/export/pdf`}>تصدير PDF</a>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead style={{ position:'sticky', top:0, background:'var(--panel)', zIndex:1 }}><tr>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>#</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الحالة</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>المطلوب</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>المستلم</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>الإجمالي</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>التاريخ</th>
          <th style={{textAlign:'right',padding:8,borderBottom:'1px solid #1c2333'}}>تفاصيل</th>
        </tr></thead>
        <tbody>
          {vendorOrders.map((o:any)=> (
            <tr key={o.orderId}>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{String(o.orderId).slice(0,6)}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.status}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.requestedQty}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.receivedQty}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{o.total}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>{new Date(o.createdAt).toLocaleString()}</td>
              <td style={{padding:8,borderBottom:'1px solid #1c2333'}}>
                <button className="btn btn-xs" onClick={async()=>{ const j = await (await fetch(`/api/admin/vendors/${id}/orders/detail?orderId=${o.orderId}`, { credentials:'include' })).json(); setOrderLines(j.lines||[]); }}>عرض</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orderLines && (
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>تفاصيل الطلب</h3>
          <table className="table">
            <thead><tr><th>المنتج</th><th>SKU</th><th>المطلوب</th><th>المستلم</th></tr></thead>
            <tbody>
              {orderLines.map((l:any)=> (<tr key={l.productId}><td>{l.name}</td><td>{l.sku||'-'}</td><td>{l.requestedQty}</td><td>{l.receivedQty}</td></tr>))}
            </tbody>
          </table>
          <div style={{ textAlign:'left' }}><button className="btn btn-sm btn-outline" onClick={()=> setOrderLines(null)}>إغلاق</button></div>
        </div>
      )}
      </>
      )}

      {tab==='ledger' && (
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>الحساب المالي</h3>
          <div style={{ marginBottom:8 }}>الرصيد الحالي: <b>{Number(ledger.balance||0).toFixed(2)}</b></div>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <input className="input" placeholder="المبلغ" value={amount} onChange={(e)=> setAmount(e.target.value)} />
            <select className="select" value={type} onChange={(e)=> setType(e.target.value as any)}>
              <option value="CREDIT">إضافة (CREDIT)</option>
              <option value="DEBIT">خصم (DEBIT)</option>
            </select>
            <input className="input" placeholder="ملاحظة" value={note} onChange={(e)=> setNote(e.target.value)} />
          </div>
          <button className="btn btn-sm" onClick={async()=>{ const amt=Number(amount); if(!Number.isFinite(amt)) return; await fetch(`/api/admin/vendors/${id}/ledger`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ amount: amt, type, note: note||undefined }) }); const j = await (await fetch(`/api/admin/vendors/${id}/ledger`, { credentials:'include' })).json(); setLedger({ entries:j.entries||[], balance:j.balance||0 }); setAmount(''); setNote(''); }}>حفظ المعاملة</button>
          <table className="table" style={{ marginTop:8 }}>
            <thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>ملاحظة</th></tr></thead>
            <tbody>
              {ledger.entries.length ? ledger.entries.map((it:any)=> (
                <tr key={it.id}><td>{new Date(it.createdAt).toLocaleString()}</td><td>{it.type}</td><td>{Number(it.amount).toFixed(2)}</td><td>{it.note||'-'}</td></tr>
              )) : (<tr><td colSpan={4}>لا توجد معاملات</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      {tab==='invoices' && (
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>الفواتير والمدفوعات</h3>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/export/xls?type=invoices`}>تصدير Excel</a>
            <a className="btn btn-sm btn-outline" href={`/api/admin/vendors/${id}/export/pdf?type=invoices`}>تصدير PDF</a>
          </div>
          <table className="table">
            <thead><tr><th>الطلب</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {(invoices||[]).map((iv:any)=> (
                <tr key={String(iv.orderId)}><td>{String(iv.orderId).slice(0,6)}</td><td>{Number(iv.amount||0).toFixed(2)}</td><td>{iv.status||'-'}</td><td>{new Date(iv.createdAt||Date.now()).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==='docs' && (
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>الوثائق</h3>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <input className="input" placeholder="نوع الوثيقة" value={docType} onChange={(e)=> setDocType(e.target.value)} />
            <input className="input" type="date" value={docExpiry} onChange={(e)=> setDocExpiry(e.target.value)} />
            <input className="input" type="file" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=> setDocFile(String(r.result||'')); r.readAsDataURL(f); }} />
          </div>
          <button className="btn btn-sm" onClick={async()=>{ if(!docFile) return; await fetch(`/api/admin/vendors/${id}/documents`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ docType, base64: docFile, expiresAt: docExpiry||undefined }) }); const j = await (await fetch(`/api/admin/vendors/${id}/documents`, { credentials:'include' })).json(); setDocs(j.documents||[]); setDocFile(''); setDocExpiry(''); }}>رفع الوثيقة</button>
          <table className="table" style={{ marginTop:8 }}>
            <thead><tr><th>النوع</th><th>الرابط</th><th>انتهاء</th></tr></thead>
            <tbody>
              {docs.length ? docs.map((dc:any)=> (
                <tr key={dc.id}><td>{dc.docType}</td><td><a className="link" href={dc.url} target="_blank">فتح</a></td><td>{dc.expiresAt? String(dc.expiresAt).slice(0,10) : '—'}</td></tr>
              )) : (<tr><td colSpan={3}>لا توجد وثائق</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      {tab==='scorecard' && (
        <div className="panel" style={{ marginTop:12 }}>
          <h3 style={{ marginTop:0 }}>التقارير والتنبيهات</h3>
          <Scorecard id={id} apiBase={apiBase} />
          <Notifications id={id} apiBase={apiBase} />
        </div>
      )}
    </main>
  );
}

function Scorecard({ id, apiBase }: { id: string; apiBase: string }) {
  const [m, setM] = React.useState<any>(null);
  React.useEffect(()=>{ fetch(`/api/admin/vendors/${id}/scorecard`, { credentials:'include' }).then(r=>r.json()).then(setM); },[id]);
  if (!m) return <div>Loading…</div>;
  return (
    <div className="grid" style={{ gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
      <div className="panel">إجمالي الطلبات: {m.ordersCount}</div>
      <div className="panel">تم التسليم: {m.deliveredCount}</div>
      <div className="panel">ملغي: {m.cancelledCount}</div>
      <div className="panel">عمر متوسط (ساعات): {Number(m.avgAgeHours||0).toFixed(1)}</div>
    </div>
  );
}

function Notifications({ id, apiBase }: { id: string; apiBase: string }) {
  const [list, setList] = React.useState<any[]>([]);
  const [message, setMessage] = React.useState('');
  React.useEffect(()=>{ fetch(`/api/admin/vendors/${id}/notifications`, { credentials:'include' }).then(r=>r.json()).then(j=> setList(j.notifications||[])); },[id]);
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns:'1fr auto', gap:8, marginBottom:8 }}>
        <input className="input" placeholder="رسالة فورية" value={message} onChange={(e)=> setMessage(e.target.value)} />
        <button className="btn btn-sm" onClick={async()=>{ if(!message) return; await fetch(`/api/admin/vendors/${id}/notifications`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ message }) }); setMessage(''); const j= await (await fetch(`/api/admin/vendors/${id}/notifications`, { credentials:'include' })).json(); setList(j.notifications||[]); }}>إرسال</button>
      </div>
      <table className="table">
        <thead><tr><th>التاريخ</th><th>الحدث</th><th>تفاصيل</th></tr></thead>
        <tbody>
          {list.length ? list.map((n:any, idx:number)=> (
            <tr key={n.id || idx}><td>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'}</td><td>{n.action || n.channel || '-'}</td><td><pre style={{ whiteSpace:'pre-wrap' }}>{typeof n.details==='object'? JSON.stringify(n.details) : (n.message || '-') }</pre></td></tr>
          )) : (<tr><td colSpan={3}>لا توجد تنبيهات</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

