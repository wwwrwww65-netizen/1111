"use client";
import React from 'react';
import { resolveApiBase } from '../../../../lib/apiBase';
import { useParams, useSearchParams } from 'next/navigation';

export default function SortingOrderPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const params = useParams() as Record<string, string|undefined>;
  const orderId = String(params?.id || '');
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(()=> Object.keys(selected).filter(k=> selected[k]), [selected]);
  const allChecked = React.useMemo(()=> items.length>0 && items.every(r=> selected[r.orderItemId]), [items, selected]);
  const [preview, setPreview] = React.useState<string|undefined>(undefined);
  const sp = useSearchParams();
  const readOnly = React.useMemo(()=>{
    try { return String((sp as any)?.get?.('readonly')||'')==='1'; } catch { return false; }
  }, [sp]);

  React.useEffect(()=>{ (async()=>{
    setLoading(true);
    try{
      const url = new URL(`${apiBase}/api/admin/logistics/warehouse/sorting/items`);
      url.searchParams.set('orderId', orderId);
      const j = await (await fetch(url.toString(), { credentials:'include' })).json();
      setItems(j.items||[]);
      setSelected({});
    } finally { setLoading(false); }
  })(); }, [apiBase, orderId]);

  async function setResultFor(id: string, result: 'MATCH'|'DIFF'|'ISSUE', note?: string){
    await fetch(`${apiBase}/api/admin/logistics/warehouse/sorting/item`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ orderItemId: id, result, note }) });
    setMsg('تم الحفظ');
  }

  async function setResultBulk(result: 'MATCH'|'DIFF'|'ISSUE'){
    for (const id of selectedIds){ await setResultFor(id, result); }
  }

  function StatusBadge({ status }: { status?: string|null }){
    const s = String(status||'').toUpperCase();
    const ok = s==='RECEIVED' || s==='MATCH';
    return <span className={`badge ${ok? 'ok':'warn'}`}>{ok? 'مطابق/مستلم' : 'لم يتم الاستلام'}</span>;
  }

  function normalizeImage(u?: string){ try{ const s=String(u||''); if(!s) return ''; if(/^https?:\/\//i.test(s)) return s; const base=(window as any).API_BASE||''; if(s.startsWith('/uploads')) return `${base}${s}`; if(s.startsWith('uploads/')) return `${base}/${s}`; return s; }catch{ return '' } }

  return (
    <main className="panel" style={{ padding:16 }}>
      <div className="toolbar" style={{ display:'flex', gap:8, position:'sticky', top:0, background:'var(--panel)', zIndex:10, padding:'6px 0', justifyContent:'flex-start' }}>
        <a className="btn btn-sm" href="/logistics/warehouse?tab=sorting">العودة لقائمة الفرز</a>
        <a className="btn btn-sm btn-outline" href="/logistics/warehouse?tab=inbound">الاستلام من السائق</a>
        <a className="btn btn-sm btn-outline" href="/logistics/warehouse?tab=ready">جاهز للتسليم</a>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, marginTop:6 }}>
        <button className="icon-btn" onClick={()=> history.length>1? history.back() : location.assign('/logistics/warehouse?tab=sorting')}>رجوع</button>
        <h1 style={{ margin:0 }}>تفاصيل الطلب · <span>{orderId.slice(0,8)}</span></h1>
      </div>
      {selectedIds.length>0 && !readOnly && (
        <div className="panel" style={{ position:'sticky', top:42, zIndex:9, marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>المحدد: {selectedIds.length}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-sm" onClick={()=> setResultBulk('MATCH')}>تأكيد المطابقة (المحدد)</button>
            <button className="btn btn-sm btn-outline" onClick={()=> setResultBulk('DIFF')}>تسجيل اختلاف (المحدد)</button>
            <button className="btn btn-sm btn-outline" onClick={()=> setResultBulk('ISSUE')}>توثيق مشكلة (المحدد)</button>
          </div>
        </div>
      )}
      {loading && <div className="panel">جارٍ التحميل…</div>}
      {!loading && (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>{!readOnly && (<input type="checkbox" checked={allChecked} onChange={e=>{ const checked=e.currentTarget.checked; const next:Record<string,boolean>={}; for(const it of items) next[it.orderItemId]=checked; setSelected(next); }} />)}</th>
                <th>الصورة</th>
                <th>المنتج</th>
                <th>المقاسات</th>
                <th>الألوان</th>
                <th>SKU</th>
                <th>الكمية</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {items.length? items.map((r:any)=> (
                <tr key={r.orderItemId}>
                  <td>{!readOnly && (<input type="checkbox" checked={!!selected[r.orderItemId]} onChange={e=> setSelected(prev=> ({ ...prev, [r.orderItemId]: e.currentTarget.checked }))} />)}</td>
                  <td>
                    {r.image? (
                      <img src={normalizeImage(r.image)} style={{ width:42, height:42, objectFit:'cover', borderRadius:6, cursor:'zoom-in' }} onClick={()=> setPreview(normalizeImage(r.image))} />
                    ): (<div style={{ width:42, height:42, background:'#0b0e14', borderRadius:6 }} />)}
                  </td>
                  <td>{r.name||'-'}</td>
                  <td>{r.size||'-'}</td>
                  <td>{r.color||'-'}</td>
                  <td>{r.sku||'-'}</td>
                  <td>{r.quantity||0}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ display:'flex', gap:6 }}>{!readOnly && (<>
                    <button className="btn btn-sm" onClick={()=> setResultFor(r.orderItemId, 'MATCH')}>تأكيد المطابقة</button>
                    <button className="btn btn-sm btn-outline" onClick={()=> setResultFor(r.orderItemId, 'DIFF')}>تسجيل اختلاف</button>
                    <button className="btn btn-sm btn-outline" onClick={()=> setResultFor(r.orderItemId, 'ISSUE')}>توثيق مشكلة</button>
                  </>)}</td>
                </tr>
              )) : (<tr><td colSpan={9} style={{ color:'var(--sub)' }}>لا توجد عناصر</td></tr>)}
            </tbody>
          </table>
        </div>
      )}
      {msg && <div className="text-sm" style={{ color:'#9ae6b4', marginTop:8 }}>{msg}</div>}

      {preview && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'grid', placeItems:'center', zIndex:50 }} onClick={()=> setPreview(undefined)}>
          <img src={preview} style={{ maxWidth:'90vw', maxHeight:'90vh', borderRadius:8, boxShadow:'0 10px 30px rgba(0,0,0,.4)' }} />
        </div>
      )}
    </main>
  );
}



