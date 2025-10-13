"use client";
import { trpc } from "../providers";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";
export const dynamic = 'force-dynamic';

export default function AdminProducts(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(12);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [total, setTotal] = React.useState<number|null>(0);
  const [hasMore, setHasMore] = React.useState<boolean>(false);
  const [nextCursor, setNextCursor] = React.useState<{id:string; createdAt:string}|null>(null);
  const q = trpc;
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1600); };
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const ctlRef = React.useRef<AbortController|null>(null);
  async function load(){
    if (ctlRef.current) { try { ctlRef.current.abort(); } catch {} }
    const ctl = new AbortController(); ctlRef.current = ctl;
    const url = new URL(`/api/admin/products`, window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (search) url.searchParams.set('search', search);
    if (status) url.searchParams.set('status', status);
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    // request lean payload for faster first paint
    url.searchParams.set('suggest','1');
    if (nextCursor && page>1) { url.searchParams.set('afterId', nextCursor.id); url.searchParams.set('afterCreated', nextCursor.createdAt); }
    const j = await (await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() }, signal: ctl.signal })).json();
    setRows(j.products||[]);
    setTotal(j.pagination?.total?? null);
    setHasMore(Boolean(j.pagination?.hasMore));
    setNextCursor(j.pagination?.nextCursor||null);
  }
  React.useEffect(()=>{ load(); return ()=> { try { ctlRef.current?.abort(); } catch {} } }, [page, status, categoryId]);
  React.useEffect(()=>{
    const t = setTimeout(()=>{ setPage(1); load(); }, 300);
    return ()=> clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const createProduct = q.admin.createProduct.useMutation();
  const createVariants = typeof q.admin.createProductVariants?.useMutation === 'function'
    ? q.admin.createProductVariants.useMutation()
    : undefined as any;

  const totalPages = Math.max(1, Math.ceil(total/limit));

  function activeBadge(isActive: boolean): string {
    return isActive ? 'badge ok' : 'badge err';
  }

  async function applyProductStatus(id: string, status: 'PUBLISHED'|'ARCHIVED'|'DISABLED') {
    try {
      const r = await fetch('/api/admin/trpc', {
        method: 'POST',
        headers: { 'content-type':'application/json', ...authHeaders() },
        credentials:'include',
        body: JSON.stringify({
          path: 'admin.setProductStatus',
          input: { id, status }
        })
      });
      if (!r.ok) throw new Error('status failed');
      await load();
      showToast('تم تحديث الحالة');
    } catch {
      showToast('فشل تحديث الحالة');
    }
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إدارة المنتجات</h1>
        <a href="/products/new" className="btn">إضافة منتج</a>
      </div>

      {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
      <div className="toolbar" style={{ marginBottom:12 }}>
        <div className="search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/sku" className="input" /></div>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="select">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
        <div className="actions">
          <button onClick={()=>{ setPage(1); load(); }} className="btn btn-outline">بحث</button>
          <button className="btn danger" onClick={async ()=>{
          const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
          const r = await fetch(`/api/admin/products/bulk-delete`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids }) });
          if (r.ok) { setSelected({}); setAllChecked(false); await load(); showToast('تم حذف العناصر المحددة'); }
          else {
            try { const j = await r.json(); alert(j?.error||'فشل حذف العناصر'); } catch { alert('فشل حذف العناصر'); }
          }
        }}>حذف المحدد</button>
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(p=> [p.id, v]))); }} /></th>
              {/* <th style={{minWidth:160}}>ID</th> */}
              <th style={{minWidth:120}}>صورة</th>
              <th style={{minWidth:220}}>الاسم</th>
              <th style={{minWidth:160}}>SKU/التباينات</th>
              <th style={{minWidth:120}}>سعر البيع</th>
              <th style={{minWidth:120}}>المخزون</th>
              <th style={{minWidth:140}}>الحالة</th>
              <th style={{minWidth:180}}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p: any) => {
              const totalStock = (p.variants||[]).reduce((acc:number,v:any)=> acc + (v.stockQuantity||0), 0) + (p.stockQuantity||0);
              return (
                <tr key={p.id} style={{ height:72 }}>
                  <td><input type="checkbox" checked={!!selected[p.id]} onChange={()=> setSelected(s=> ({...s, [p.id]: !s[p.id]}))} /></td>
                  {/* <td>{p.id.slice(0,6)}</td> */}
                  <td>{p.images?.[0] ? <img src={p.images[0]} alt={p.name} width={64} height={64} style={{ width:64, height:64, objectFit:'cover', borderRadius:6 }} /> : '-'}</td>
                  <td><div className="line-2" style={{maxWidth:420}}>{p.name}</div></td>
                  <td>{p.sku || (p.variants?.length ? `${p.variants.length} variants` : '-')}</td>
                  <td>{p.price}</td>
                  <td>{totalStock}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className={activeBadge(!!p.isActive)}>{p.isActive ? 'active' : 'archived'}</span>
                      <select className="select" defaultValue={p.isActive ? 'PUBLISHED' : 'ARCHIVED'} onChange={(e)=> applyProductStatus(p.id, e.target.value as any)}>
                        <option value="PUBLISHED">نشر</option>
                        <option value="ARCHIVED">مؤرشف</option>
                        <option value="DISABLED">متوقف</option>
                      </select>
                    </div>
                  </td>
                  <td>
                    <a href={`/products/${p.id}`} className="btn btn-md" style={{ marginInlineEnd:6 }}>عرض</a>
                    <a href={`/products/new?id=${p.id}`} className="btn btn-md btn-outline" style={{ marginInlineEnd:6 }}>تعديل</a>
                    <button onClick={async ()=>{ const r=await fetch(`/api/admin/products/${p.id}`, { method:'DELETE', credentials:'include' }); if (r.ok){ showToast('تم الحذف'); } await load(); }} className="btn btn-md">حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop:12, display:'flex', alignItems:'center', gap:8 }}>
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="icon-btn">السابق</button>
        {total!=null ? (
          <span style={{ color:'var(--sub)' }}>{page} / {Math.max(1, Math.ceil((total||0)/limit))}</span>
        ) : (
          <span style={{ color:'var(--sub)' }}>{hasMore? '...' : 'نهاية'}</span>
        )}
        <button disabled={total!=null ? (page>=Math.max(1, Math.ceil((total||0)/limit))) : !hasMore} onClick={()=> setPage(p=> p+1)} className="icon-btn">التالي</button>
      </div>
    </main>
  );
}