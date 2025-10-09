"use client";
import React from "react";
import { ResponsiveTable, FilterBar, useIsMobile } from "../components/Mobile";
import { resolveApiBase } from "../lib/apiBase";

export default function OrdersPage(): JSX.Element {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [status, setStatus] = React.useState<string>("");
  const [search, setSearch] = React.useState<string>("");
  const [driverId, setDriverId] = React.useState<string>("");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [amountMin, setAmountMin] = React.useState<string>("");
  const [amountMax, setAmountMax] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<string>('createdAt');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc');
  const [rows, setRows] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=>setToast(""), 1600); };
  const [total, setTotal] = React.useState(0);
  const [drivers, setDrivers] = React.useState<Array<{id:string;name:string}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [pendingFilters, setPendingFilters] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [coName, setCoName] = React.useState('');
  const [coEmail, setCoEmail] = React.useState('');
  const [coPhone, setCoPhone] = React.useState('');
  const [coStreet, setCoStreet] = React.useState('');
  const [coItems, setCoItems] = React.useState<Array<{productId:string; quantity:number; price?:number}>>([{ productId:'', quantity:1 }]);

  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadCtlRef = React.useRef<AbortController|null>(null);
  const debounceRef = React.useRef<any>(null);
  async function load() {
    const url = new URL(`/api/admin/orders/list`, apiBase);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(pageSize));
    if (status) url.searchParams.set("status", status);
    if (search) url.searchParams.set("search", search);
    if (driverId) url.searchParams.set("driverId", driverId);
    if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
    if (dateTo) url.searchParams.set("dateTo", dateTo);
    if (amountMin) url.searchParams.set("amountMin", amountMin);
    if (amountMax) url.searchParams.set("amountMax", amountMax);
    if (sortBy) url.searchParams.set("sortBy", sortBy);
    if (sortDir) url.searchParams.set("sortDir", sortDir);
    try {
      setBusy(true);
      if (loadCtlRef.current) { try { loadCtlRef.current.abort(); } catch {} }
      const ctl = new AbortController(); loadCtlRef.current = ctl;
      const res = await fetch(`${apiBase}/api/admin/orders/list${url.search}`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store', signal: ctl.signal });
      const json = await res.json();
      setRows(json.orders || []);
      setTotal(json.pagination?.total || 0);
    } catch (e:any) {
      if (e?.name !== 'AbortError') console.warn('orders load error', e);
    } finally {
      setBusy(false);
      setPendingFilters(false);
    }
  }

  React.useEffect(() => { load(); }, [page, pageSize, sortBy, sortDir]);
  React.useEffect(()=>{
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPendingFilters(true);
    debounceRef.current = setTimeout(()=>{ setPage(1); load(); }, 350);
    return ()=> { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, driverId, dateFrom, dateTo, amountMin, amountMax]);
  React.useEffect(()=>{
    const ctl = new AbortController();
    (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store', signal: ctl.signal })).json(); setDrivers(j.drivers||[]);} catch{} })();
    return ()=> { try { ctl.abort(); } catch {} };
  }, [apiBase]);

  async function ship(orderId: string) {
    await fetch(`${apiBase}/api/admin/orders/ship`, { method: 'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }
  async function refund(orderId: string) {
    await fetch(`${apiBase}/api/admin/payments/refund`, { method: 'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }
  async function bulk(action: 'ship'|'cancel'){
    const ids = Object.keys(selected).filter(k=> selected[k]); if (!ids.length) return;
    for (const id of ids) {
      if (action==='ship') await ship(id);
      if (action==='cancel') await fetch(`${apiBase}/api/admin/orders/cancel`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ orderId:id }) });
    }
    setSelected({}); await load();
  }
  async function assign(orderId: string, driverId: string) {
    await fetch(`${apiBase}/api/admin/orders/assign-driver`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId, driverId }) });
    await load();
  }

  async function changeOrderStatus(orderId: string, action: 'approve'|'reject'|'complete'){
    await fetch(`${apiBase}/api/admin/status/change`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ entity:'order', id: orderId, action }) });
    await load();
  }

  function statusClass(s: string): string {
    switch (s) {
      case 'DELIVERED': return 'ok';
      case 'PAID': return 'ok';
      case 'PENDING': return 'warn';
      case 'SHIPPED': return 'warn';
      case 'CANCELLED': return 'err';
      default: return '';
    }
  }
  function formatMoney(v: number): string {
    try { return Number(v||0).toLocaleString('ar-SA'); } catch { return String(v); }
  }

  return (
    <>
    <main className="panel" style={{ padding:16 }}>
      {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>الطلبات</h1>
        <div style={{ display:'flex', gap:8 }}>
          <a className="btn" href={`${apiBase}/api/admin/orders/export/csv`}>تصدير CSV</a>
          <button className="btn" onClick={()=>setShowCreate(true)}>إنشاء طلب</button>
        </div>
      </div>

      <FilterBar value={search} onChange={(v)=> setSearch(v)} right={<div style={{ color:'var(--sub)', fontSize:12 }}>{pendingFilters ? '...تطبيق المرشحات' : `${total} نتيجة`}</div>}>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="select filter">
          <option value="">كل الحالات</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="PAID">مدفوع</option>
          <option value="SHIPPED">تم الشحن</option>
          <option value="DELIVERED">تم التسليم</option>
          <option value="CANCELLED">ملغي</option>
        </select>
        <select value={driverId} onChange={(e)=>setDriverId(e.target.value)} className="select filter">
          <option value="">كل السائقين</option>
          {drivers.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
        </select>
        <input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="input" />
        <input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="input" />
        <div style={{ display:'flex', gap:8 }}>
          <input type="number" placeholder="المبلغ من" value={amountMin} onChange={(e)=>setAmountMin(e.target.value)} className="input" />
          <input type="number" placeholder="إلى" value={amountMax} onChange={(e)=>setAmountMax(e.target.value)} className="input" />
        </div>
        <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="select filter">
          <option value="createdAt">الأحدث</option>
          <option value="total">الإجمالي</option>
          <option value="status">الحالة</option>
        </select>
        <select value={sortDir} onChange={(e)=>setSortDir(e.target.value as any)} className="select filter">
          <option value="desc">تنازلي</option>
          <option value="asc">تصاعدي</option>
        </select>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={async ()=>{ await bulk('ship'); showToast('تم شحن المحدد'); }}>شحن المحدد</button>
          <button className="btn btn-outline" onClick={()=> bulk('cancel')}>إلغاء المحدد</button>
          <button className="btn danger" onClick={async ()=>{
            const ids = Object.keys(selected).filter(k=> selected[k]); if (!ids.length) return;
            const r = await fetch(`/api/admin/orders/bulk-delete`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify({ ids }) });
            if (r.ok) { setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد'); }
            else { try { const j=await r.json(); alert(j?.error||'فشل الحذف'); } catch { alert('فشل الحذف'); } }
          }}>حذف المحدد</button>
        </div>
      </FilterBar>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
        {[
          {k:'', label:'الكل'},
          {k:'PENDING', label:'قيد الانتظار'},
          {k:'PAID', label:'مدفوع'},
          {k:'SHIPPED', label:'تم الشحن'},
          {k:'DELIVERED', label:'تم التسليم'},
          {k:'CANCELLED', label:'ملغي'},
        ].map(it=> (
          <button key={it.k||'all'} onClick={()=> setStatus(it.k)} className={`btn ${status===it.k? '':'btn-outline'}`}>{it.label}</button>
        ))}
      </div>

      <ResponsiveTable
        items={rows}
        isLoading={busy}
        columns={[
          { key:'_sel', title:(<input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(o=> [o.id, v]))); }} />), minWidth:40 },
          { key:'id', title:'رقم الطلب', minWidth:160 },
          { key:'createdAt', title:'تاريخ', minWidth:120 },
          { key:'user', title:'العميل', minWidth:220 },
          { key:'total', title:'الإجمالي', minWidth:120 },
          { key:'status', title:'الحالة', minWidth:220 },
          { key:'actions', title:'إجراءات', minWidth:200 },
        ]}
        renderCard={(o:any)=>{
          const shippingState = o.shipments?.[0]?.status || (o.status==='SHIPPED'?'IN_TRANSIT':o.status==='DELIVERED'?'DELIVERED':'-');
          return (
            <div style={{ display:'grid', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <a href={`/orders/${o.id}`} style={{ color:'var(--text)', fontWeight:700 }}>{o.id}</a>
                <span className={`badge ${statusClass(o.status)}`}>{o.status}</span>
              </div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{new Date(o.createdAt).toLocaleString()}</div>
              <div>{o.user?.name||'-'} <span style={{ color:'var(--sub)' }}>· {o.user?.phone||o.user?.email||'-'}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>الإجمالي: {formatMoney(o.total)}</div>
                <span className={`badge ${statusClass(shippingState)}`}>{shippingState}</span>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <a href={`/orders/${o.id}`} className="btn btn-sm">عرض</a>
                <button onClick={async ()=>{ await ship(o.id); showToast('تم الشحن'); }} className="btn btn-sm">شحن</button>
                <button onClick={async ()=>{ await refund(o.id); showToast('تم الاسترداد'); }} className="btn btn-sm">استرداد</button>
              </div>
            </div>
          );
        }}
        renderRow={(o:any)=>{
          const shippingState = o.shipments?.[0]?.status || (o.status==='SHIPPED'?'IN_TRANSIT':o.status==='DELIVERED'?'DELIVERED':'-');
          return <>
            <td><input type="checkbox" checked={!!selected[o.id]} onChange={()=> setSelected(s=> ({...s, [o.id]: !s[o.id]}))} /></td>
            <td><a href={`/orders/${o.id}`} style={{ color:'var(--text)' }}>{o.id}</a></td>
            <td>{new Date(o.createdAt).toLocaleString()}</td>
            <td>{o.user?.name||'-'}<div style={{color:'var(--sub)'}}>{o.user?.phone||o.user?.email||'-'}</div></td>
            <td>{formatMoney(o.total)}</td>
            <td>
              <div style={{ display:'grid', gap:6 }}>
                <span><span className={`badge ${statusClass(o.status)}`}>{o.status}</span></span>
                <Progress status={o.status} shipmentStatus={o.shipments?.[0]?.status} />
              </div>
            </td>
            <td>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <a href={`/orders/${o.id}`} className="btn btn-sm">عرض</a>
                <button onClick={()=>ship(o.id)} className="btn btn-sm">شحن</button>
                <button onClick={()=>refund(o.id)} className="btn btn-sm">استرداد</button>
              </div>
            </td>
          </>;
        }}
      />

      <div className="pagination" style={{ marginTop:12 }}>
        <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="icon-btn">السابق</button>
        <div style={{ color:'var(--sub)' }}>صفحة {page} من {Math.max(1, Math.ceil(total / pageSize))}</div>
        <button disabled={(page*pageSize)>=total} onClick={()=>setPage(p=>p+1)} className="icon-btn">التالي</button>
        <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="select per-page">
          {[10,20,50,100].map(n=> (<option key={n} value={n}>{n} / صفحة</option>))}
        </select>
      </div>
    </main>
    {showCreate && (
      <div className="modal">
        <div className="dialog">
          <h3 className="title">إنشاء طلب</h3>
          <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <input className="input" placeholder="اسم العميل" value={coName} onChange={(e)=>setCoName(e.target.value)} />
            <input className="input" placeholder="البريد" value={coEmail} onChange={(e)=>setCoEmail(e.target.value)} />
            <input className="input" placeholder="الهاتف" value={coPhone} onChange={(e)=>setCoPhone(e.target.value)} />
            <input className="input" placeholder="العنوان" value={coStreet} onChange={(e)=>setCoStreet(e.target.value)} />
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ color:'var(--sub)', marginBottom:6 }}>الأصناف</div>
            {coItems.map((it, idx)=> (
              <div key={idx} className="grid" style={{ gridTemplateColumns:'2fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
                <ProductSelector apiBase={apiBase} authHeaders={authHeaders} value={it.productId} onChange={(pid)=>{ const v=[...coItems]; v[idx].productId=pid; setCoItems(v); }} />
                <input className="input" type="number" placeholder="الكمية" value={it.quantity} onChange={(e)=>{ const v=[...coItems]; v[idx].quantity=Number(e.target.value||1); setCoItems(v); }} />
                <input className="input" type="number" placeholder="السعر (اختياري)" value={it.price||''} onChange={(e)=>{ const v=[...coItems]; v[idx].price=Number(e.target.value||0)||undefined; setCoItems(v); }} />
                <button className="icon-btn" onClick={()=>{ const v = coItems.filter((_,i)=>i!==idx); setCoItems(v.length? v : [{ productId:'', quantity:1 }]); }}>حذف</button>
              </div>
            ))}
            <button className="icon-btn" onClick={()=>setCoItems(v=>[...v, { productId:'', quantity:1 }])}>إضافة صنف</button>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
            <button className="icon-btn" onClick={()=>setShowCreate(false)}>إلغاء</button>
            <button className="btn" disabled={creating} onClick={async ()=>{
              setCreating(true);
              try{
                const payload = { customer: { name: coName, email: coEmail, phone: coPhone }, address: { street: coStreet }, items: coItems };
                const r = await fetch(`/api/admin/orders`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
                if (r.ok) {
                  const j = await r.json();
                  // اجعل الطلب مدفوع فوراً لبدء لوجستيات الالتقاط
                  try { await fetch(`/api/admin/status/change`, { method:'POST', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ entity:'order', id: j.order.id, action:'approve' }) }); } catch {}
                  setShowCreate(false); setCoName(''); setCoEmail(''); setCoPhone(''); setCoStreet(''); setCoItems([{ productId:'', quantity:1 }]); await load();
                }
              } finally { setCreating(false); }
            }}>{creating?'جارٍ الإنشاء…':'تأكيد'}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function Progress({ status, shipmentStatus }:{ status:string; shipmentStatus?:string }): JSX.Element {
  const steps = [
    { key:'PENDING', label:'طلب' },
    { key:'PAID', label:'دفع' },
    { key:'SHIPPED', label:'شحن' },
    { key:'DELIVERED', label:'تسليم' },
  ];
  const current = (()=>{
    const map: Record<string, number> = { PENDING:0, PAID:1, SHIPPED:2, DELIVERED:3 };
    if (shipmentStatus==='OUT_FOR_DELIVERY') return 2;
    if (shipmentStatus==='DELIVERED') return 3;
    return map[status] ?? 0;
  })();
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
      {steps.map((s, idx)=> (
        <div key={s.key} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:999, background: idx<=current? '#22c55e':'#334155' }} />
          <span style={{ fontSize:12, color: idx<=current? '#e2e8f0':'#94a3b8' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProductSelector({ apiBase, authHeaders, value, onChange }:{ apiBase:string; authHeaders:()=>Record<string,string>; value:string; onChange:(id:string)=>void }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [list, setList] = React.useState<Array<{id:string;name:string;price:number}>>([]);
  const [loading, setLoading] = React.useState(false);
  const [hover, setHover] = React.useState(-1);
  const ctlRef = React.useRef<AbortController|null>(null);
  const debRef = React.useRef<any>(null);
  function searchProducts(q:string){
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async ()=>{
      if (ctlRef.current) { try { ctlRef.current.abort(); } catch {} }
      const ctl = new AbortController(); ctlRef.current = ctl;
      setLoading(true);
      try {
        const url = new URL(`${apiBase}/api/admin/products`);
        if (q) url.searchParams.set('search', q);
        url.searchParams.set('limit','20');
        url.searchParams.set('suggest','1');
        const r = await fetch(url.toString(), { credentials:'include', headers:{ ...authHeaders() }, cache:'no-store', signal: ctl.signal });
        const j = await r.json();
        const items = (j.products||j.items||[]).map((p:any)=> ({ id:p.id, name:p.name, price:p.price||0 }));
        setList(items);
      } catch (e:any) { if (e?.name!=='AbortError') setList([]); } finally { setLoading(false); }
    }, 300);
  }
  React.useEffect(()=>{ return ()=> { if (ctlRef.current) try{ ctlRef.current.abort(); } catch{}; if (debRef.current) clearTimeout(debRef.current); }; }, []);
  React.useEffect(()=>{ if (open) searchProducts(query); }, [open]);
  return (
    <div style={{ position:'relative' }}>
      <input className="input" placeholder="بحث عن منتج…" value={query || value} onFocus={()=> setOpen(true)} onChange={(e)=>{ const val=e.target.value; setQuery(val); if (val.length>=1) searchProducts(val); else setList([]); }} onKeyDown={(e)=>{
        if (e.key==='ArrowDown') setHover(h=> Math.min((list.length-1), h+1));
        if (e.key==='ArrowUp') setHover(h=> Math.max(-1, h-1));
        if (e.key==='Enter') { if (hover>=0 && list[hover]) { onChange(list[hover].id); setQuery(list[hover].name); setOpen(false); } }
      }} />
      {open && (
        <div className="panel" style={{ position:'absolute', insetInlineStart:0, insetBlockStart:'100%', zIndex:20, width:'100%', maxHeight:240, overflowY:'auto' }}>
          {loading && <div style={{ padding:8, color:'var(--sub)' }}>جاري البحث…</div>}
          {!loading && !list.length && <div style={{ padding:8, color:'var(--sub)' }}>لا نتائج</div>}
          {list.map((p, idx)=> (
            <div key={p.id} className="row" style={{ padding:8, cursor:'pointer', background: hover===idx? 'var(--muted2)':'transparent' }} onMouseEnter={()=> setHover(idx)} onClick={()=>{ onChange(p.id); setQuery(p.name); setOpen(false); }}>
              <div style={{ fontWeight:600 }}>{p.name}</div>
              <div style={{ color:'var(--sub)' }}>{p.id.slice(0,6)} · {p.price}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

