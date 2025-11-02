"use client";
import React from 'react';
import { resolveApiBase } from '../../../../lib/apiBase';
import { useParams } from 'next/navigation';

export default function DriverInboundPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const params = useParams() as Record<string, string|undefined>;
  const driverId = String(params?.id || '');
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(()=> Object.keys(selected).filter(k=> selected[k]), [selected]);
  const allChecked = React.useMemo(()=> rows.length>0 && rows.every(r=> selected[r.orderItemId]), [rows, selected]);
  const lastPrintedIdsRef = React.useRef<string[]>([]);

  React.useEffect(()=>{ (async()=>{
    setLoading(true);
    try{
      const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
      setRows(j.items||[]);
      setSelected({});
    } finally { setLoading(false); }
  })(); }, [apiBase, driverId]);

  async function deliverOne(orderItemId: string){
    setMsg('');
    await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/deliver`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId, driverId }) });
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]); setMsg('تم تسجيل تسليم السائق');
  }
  async function receiveOne(orderItemId: string){
    setMsg('');
    await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/receive`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId }) });
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]); setMsg('تم تأكيد الاستلام');
  }
  function normalizeImage(u?: string){ try{ const s=String(u||''); if(!s) return ''; if(/^https?:\/\//i.test(s)) return s; const base=(window as any).API_BASE||''; if(s.startsWith('/uploads')) return `${base}${s}`; if(s.startsWith('uploads/')) return `${base}/${s}`; return s; }catch{ return '' } }

  // Listen for receipt-printed message from popup: mark printed and reload, then complete inbound if done
  React.useEffect(()=>{
    function onMsg(ev: MessageEvent){ try{ const data:any = ev?.data||{}; if (data && data.type==='receipt-printed') { (async()=>{ 
      try {
        const ids = Array.isArray(lastPrintedIdsRef.current) ? lastPrintedIdsRef.current : [];
        if (ids.length){ try{ await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/receipt-printed`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ driverId, orderItemIds: ids }) }); }catch{} }
        const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
        const items: any[] = j.items||[];
        const allReceivedOrEmpty = items.length===0 || items.every((it:any)=> String(it.status||'').toUpperCase()==='RECEIVED');
        if (allReceivedOrEmpty) {
          try { await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/complete`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ driverId }) }); } catch {}
          location.assign('/logistics/warehouse?tab=sorting');
        } else {
          setRows(items);
        }
      } catch {}
    })(); } }catch{}
    }
    window.addEventListener('message', onMsg);
    return ()=> window.removeEventListener('message', onMsg);
  }, [apiBase, driverId]);

  function toggleAll(e: React.ChangeEvent<HTMLInputElement>): void {
    const checked = e.currentTarget.checked;
    setSelected(() => {
      const next: Record<string, boolean> = {};
      for (const r of rows) next[r.orderItemId] = checked;
      return next;
    });
  }

  async function deliverSelected(): Promise<void> {
    setMsg('');
    for (const id of selectedIds) {
      await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/deliver`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId: id, driverId }) });
    }
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]);
    setMsg('تم تسجيل تسليم السائق للمحدد');
  }

  async function receiveSelected(): Promise<void> {
    setMsg('');
    for (const id of selectedIds) {
      await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/item/receive`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId: id }) });
    }
    const j = await (await fetch(`${apiBase}/api/admin/logistics/warehouse/driver/${encodeURIComponent(driverId)}/items`, { credentials:'include' })).json();
    setRows(j.items||[]);
    setMsg('تم تأكيد الاستلام للمحدد');
  }

  function renderReceiptHtmlFromRows(selRows: any[]): string {
    const now = new Date();
    const fmt = now.toLocaleString();
    const rowsHtml = selRows.map(r=> `
      <tr>
        <td>${r.orderCode? ('#'+r.orderCode) : r.orderId}</td>
        <td>${r.name||''}</td>
        <td>${r.size||''}</td>
        <td>${r.color||''}</td>
        <td>${r.sku||''}</td>
        <td>${r.quantity||0}</td>
      </tr>
    `).join('');
    return `<!doctype html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>إيصال استلام السائق</title>
        <style>
          body{font-family:system-ui,Segoe UI,Roboto,Arial; padding:16px; background:#fff; color:#111}
          h1{font-size:18px; margin:0 0 8px}
          .meta{color:#666; font-size:12px; margin-bottom:12px}
          table{width:100%; border-collapse:collapse}
          th,td{border:1px solid #ddd; padding:6px; font-size:12px; text-align:right}
          th{background:#f5f5f7}
          .empty{padding:24px; color:#ef4444}
        </style>
      </head>
      <body>
        <h1>إيصال استلام من السائق</h1>
        <div class="meta">السائق: ${driverId} · التاريخ: ${fmt}</div>
        ${selRows.length? (`<table>
          <thead>
            <tr><th>رقم الطلب</th><th>المنتج</th><th>المقاس</th><th>اللون</th><th>SKU</th><th>الكمية</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`) : (`<div class="empty">لا توجد عناصر مؤكدة للطباعة</div>`)}
        <script>
          window.addEventListener('load', ()=> { setTimeout(()=> { window.print(); setTimeout(()=>{ try{ if (window.opener) window.opener.postMessage({ type:'receipt-printed' }, '*'); }catch(e){} window.close(); }, 150); }, 80); });
        </script>
      </body>
    </html>`;
  }

  function printByIds(ids: string[]): void {
    const eligible = rows.filter(r=> ids.includes(r.orderItemId) && String(r.status||'').toUpperCase()==='RECEIVED');
    if (eligible.length === 0) { setMsg('لا توجد عناصر مؤكدة (تم الاستلام) للطباعة'); return; }
    lastPrintedIdsRef.current = eligible.map(e=> String(e.orderItemId));
    const html = renderReceiptHtmlFromRows(eligible);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    // After-print is handled inside popup via postMessage
  }

  async function printSelected(): Promise<void> {
    if (selectedIds.length === 0) return;
    printByIds(selectedIds);
  }

  return (
    <main className="panel" style={{ padding:16 }}>
      {/* ثابت: تبويبات المستودع */}
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0', justifyContent:'flex-start' }}>
        <a className="btn btn-sm" href="/logistics/warehouse">الاستلام من السائق</a>
        <a className="btn btn-sm btn-outline" href="/logistics/warehouse?tab=sorting">الفرز والجرد</a>
        <a className="btn btn-sm btn-outline" href="/logistics/warehouse?tab=ready">جاهز للتسليم</a>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, marginTop:6 }}>
        <button className="icon-btn" onClick={()=> history.length>1? history.back() : location.assign('/logistics/warehouse')}>رجوع</button>
        <h1 style={{ margin:0 }}>استلامات السائق · <span>{driverId.slice(0,6)}</span></h1>
      </div>
      {/* شريط إجراءات متعدد عند وجود تحديد */}
      {selectedIds.length>0 && (
        <div className="panel" style={{ position:'sticky', top:42, zIndex:9, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>المحدد: {selectedIds.length}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm" onClick={deliverSelected}>تسليم السائق</button>
            <button className="btn btn-sm" onClick={receiveSelected}>تأكيد الاستلام</button>
            <button className="btn btn-sm btn-outline" onClick={printSelected}>طباعة إيصال</button>
          </div>
        </div>
      )}
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {!loading && (
        <div className="panel">
          {rows.length>0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <button className="btn btn-sm" onClick={(e)=>{ e.preventDefault(); const allIds = rows.map((r:any)=> String(r.orderItemId)); printByIds(allIds); }}>طباعة إيصال للجميع</button>
            </div>
          )}
          <table className="table">
            <thead><tr><th><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th><th>رقم الطلب</th><th>المنتج</th><th>الصورة</th><th>المقاس</th><th>اللون</th><th>الكمية</th><th>SKU</th><th>الحالة</th><th>إجراءات</th></tr></thead>
            <tbody>
              {rows.length? rows.map((r:any)=> {
                const status = String(r.status||'').toUpperCase();
                const deliveredOk = status==='DELIVERED' || status==='RECEIVED';
                const receivedOk = status==='RECEIVED';
                return (
                  <tr key={r.orderItemId}>
                    <td><input type="checkbox" checked={!!selected[r.orderItemId]} onChange={e=> { const c = e.currentTarget.checked; setSelected(prev=> ({ ...prev, [r.orderItemId]: c })); }} /></td>
                    <td>{r.orderCode? `#${r.orderCode}`: r.orderId}</td>
                    <td>{r.name||'-'}</td>
                    <td>{r.image? (<img src={normalizeImage(r.image)} style={{ width:42, height:42, objectFit:'cover', borderRadius:6 }} />): (<div style={{ width:42, height:42, background:'#0b0e14', borderRadius:6 }} />)}</td>
                    <td>{r.size||'-'}</td>
                    <td>{r.color||'-'}</td>
                    <td>{r.quantity||0}</td>
                    <td>{r.sku||'-'}</td>
                    <td>
                      <span className={`badge ${deliveredOk? 'ok':'warn'}`} style={{ marginInlineEnd:6, background: deliveredOk? 'rgba(37,99,235,0.12)':'rgba(239,68,68,0.12)', color: deliveredOk? '#2563eb':'#ef4444', border: `1px solid ${deliveredOk? '#2563eb':'#ef4444'}`, boxShadow: `0 0 0 1px ${deliveredOk? '#2563eb':'#ef4444'} inset, 0 0 8px ${(deliveredOk? '#2563eb':'#ef4444')}66`, display:'inline-flex', alignItems:'center', gap:6, paddingInline:10 }}>
                        <span style={{ width:8, height:8, borderRadius:999, background: deliveredOk? '#2563eb':'#ef4444', boxShadow:`0 0 8px ${(deliveredOk? '#2563eb':'#ef4444')}AA` }} /> تسليم
                      </span>
                      <span className={`badge ${receivedOk? 'ok':'warn'}`} style={{ background: receivedOk? 'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', color: receivedOk? '#10b981':'#ef4444', border: `1px solid ${receivedOk? '#10b981':'#ef4444'}`, boxShadow: `0 0 0 1px ${receivedOk? '#10b981':'#ef4444'} inset, 0 0 8px ${(receivedOk? '#10b981':'#ef4444')}66`, display:'inline-flex', alignItems:'center', gap:6, paddingInline:10 }}>
                        <span style={{ width:8, height:8, borderRadius:999, background: receivedOk? '#10b981':'#ef4444', boxShadow:`0 0 8px ${(receivedOk? '#10b981':'#ef4444')}AA` }} /> استلام
                      </span>
                    </td>
                    <td style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm" onClick={()=> deliverOne(r.orderItemId)}>تسليم السائق</button>
                      <button className="btn btn-sm btn-outline" onClick={()=> receiveOne(r.orderItemId)}>تأكيد الاستلام</button>
                    </td>
                  </tr>
                );
              }) : (<tr><td colSpan={10} style={{ color:'var(--sub)' }}>لا توجد عناصر</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {msg && <div className="text-sm" style={{ color:'#9ae6b4', marginTop:8 }}>{msg}</div>}
    </main>
  );
}
