"use client";
import { trpc } from "../providers";
import React from "react";
export const dynamic = 'force-dynamic';

export default function AdminProducts(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [total, setTotal] = React.useState(0);
  const q = trpc;
  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(() => {
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);
  async function load(){
    const url = new URL(`${apiBase}/api/admin/products`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    if (search) url.searchParams.set('search', search);
    if (status) url.searchParams.set('status', status);
    if (categoryId) url.searchParams.set('categoryId', categoryId);
    const j = await (await fetch(url.toString(), { credentials:'include', cache:'no-store', headers: { ...authHeaders() } })).json();
    setRows(j.products||[]); setTotal(j.pagination?.total||0);
  }
  React.useEffect(()=>{ load(); }, [page, status, categoryId, apiBase]);
  const createProduct = q.admin.createProduct.useMutation();
  const createVariants = typeof q.admin.createProductVariants?.useMutation === 'function'
    ? q.admin.createProductVariants.useMutation()
    : undefined as any;

  const totalPages = Math.max(1, Math.ceil(total/limit));

  function activeBadge(isActive: boolean): string {
    return isActive ? 'badge ok' : 'badge err';
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
        <h1 style={{ margin:0 }}>إدارة المنتجات</h1>
        <a href="/products/new" className="btn">إضافة منتج</a>
      </div>

      <div className="toolbar" style={{ marginBottom:12 }}>
        <div className="search"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث بالاسم/sku" className="input" /></div>
        <button onClick={()=>{ setPage(1); load(); }} className="btn btn-md btn-outline">بحث</button>
        <select value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} className="select">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th style={{minWidth:160}}>ID</th>
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
                  <td>{p.id.slice(0,6)}</td>
                  <td>{p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width:80, height:80, objectFit:'cover', borderRadius:6 }} /> : '-'}</td>
                  <td>{p.name}</td>
                  <td>{p.sku || (p.variants?.length ? `${p.variants.length} variants` : '-')}</td>
                  <td>{p.price}</td>
                  <td>{totalStock}</td>
                  <td><span className={activeBadge(!!p.isActive)}>{p.isActive ? 'active' : 'archived'}</span></td>
                  <td>
                    <a href={`/products/${p.id}`} className="btn btn-md" style={{ marginInlineEnd:6 }}>عرض</a>
                    <a href={`/products/new?id=${p.id}`} className="btn btn-md btn-outline" style={{ marginInlineEnd:6 }}>تعديل</a>
                    <button onClick={async ()=>{ await fetch(`${apiBase}/api/admin/products/${p.id}`, { method:'DELETE', credentials:'include' }); await load(); }} className="btn btn-md">حذف</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination" style={{ marginTop:12 }}>
        <button disabled={page<=1} onClick={()=> setPage(p=> Math.max(1,p-1))} className="icon-btn">السابق</button>
        <span style={{ color:'var(--sub)' }}>{page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=> setPage(p=> Math.min(totalPages,p+1))} className="icon-btn">التالي</button>
      </div>
    </main>
  );
}