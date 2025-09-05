"use client";
import React from "react";

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
  const [total, setTotal] = React.useState(0);
  const [drivers, setDrivers] = React.useState<Array<{id:string;name:string}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [coName, setCoName] = React.useState('');
  const [coEmail, setCoEmail] = React.useState('');
  const [coPhone, setCoPhone] = React.useState('');
  const [coStreet, setCoStreet] = React.useState('');
  const [coItems, setCoItems] = React.useState<Array<{productId:string; quantity:number; price?:number}>>([{ productId:'', quantity:1 }]);

  const apiBase = React.useMemo(()=>{
    return (process.env.NEXT_PUBLIC_API_BASE_URL as string) || (typeof window !== 'undefined' ? (window.location.origin.replace('jeeey-manger','jeeeyai')) : 'http://localhost:4000');
  }, []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    return m ? { Authorization: `Bearer ${decodeURIComponent(m[1])}` } : {};
  }, []);

  async function load() {
    const url = new URL(`${apiBase}/api/admin/orders/list`);
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
    setBusy(true);
    const res = await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
    const json = await res.json();
    setBusy(false);
    setRows(json.orders || []);
    setTotal(json.pagination?.total || 0);
  }

  React.useEffect(() => { load(); }, [page, pageSize, sortBy, sortDir]);
  React.useEffect(()=>{ (async ()=>{ try{ const j = await (await fetch(`${apiBase}/api/admin/drivers`, { credentials:'include', headers: { ...authHeaders() } })).json(); setDrivers(j.drivers||[]);} catch{} })(); }, [apiBase]);

  async function ship(orderId: string) {
    await fetch(`${apiBase}/api/admin/orders/ship`, { method: 'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }
  async function refund(orderId: string) {
    await fetch(`${apiBase}/api/admin/payments/refund`, { method: 'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId }) });
    await load();
  }
  async function assign(orderId: string, driverId: string) {
    await fetch(`${apiBase}/api/admin/orders/assign-driver`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify({ orderId, driverId }) });
    await load();
  }

  return (
    <>
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>الطلبات</h1>
        <div style={{ display:'flex', gap:8 }}>
          <a className="btn" href={`${apiBase}/api/admin/orders/export/csv`}>تصدير CSV</a>
          <button className="btn" onClick={()=>setShowCreate(true)}>إنشاء طلب</button>
        </div>
      </div>

      <div className="toolbar" style={{ justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search"><input className="input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="بحث (المعرف/الاسم/الإيميل/الهاتف)" /></div>
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
          <button onClick={()=>{ setPage(1); load(); }} className="btn btn-outline">تطبيق</button>
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>رقم الطلب</th>
            <th>تاريخ</th>
            <th>العميل</th>
            <th>العنوان</th>
            <th>عدد الأصناف</th>
            <th>الإجمالي</th>
            <th>حالة الطلب</th>
            <th>حالة الدفع</th>
            <th>حالة الشحن</th>
            <th>السائق</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o)=> {
            const shippingState = o.shipments?.[0]?.status || (o.status==='SHIPPED'?'IN_TRANSIT':o.status==='DELIVERED'?'DELIVERED':'-');
            return (
            <tr key={o.id}>
              <td><a href={`/orders/${o.id}`} style={{ color:'var(--text)' }}>{o.id}</a></td>
              <td>{new Date(o.createdAt).toLocaleString()}</td>
              <td>{o.user?.name||'-'}<div style={{color:'var(--sub)'}}>{o.user?.phone||o.user?.email||'-'}</div></td>
              <td>{o.shippingAddress?.street||'-'}</td>
              <td>{o.items?.length||0}</td>
              <td>{o.total}</td>
              <td><span className="badge">{o.status}</span></td>
              <td><span className="badge">{o.payment?.status||'-'}</span></td>
              <td><span className="badge">{shippingState}</span></td>
              <td>{o.assignedDriver?.name||'-'}</td>
              <td>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <a href={`/orders/${o.id}`} className="btn" aria-label="عرض">عرض</a>
                  <button onClick={()=>ship(o.id)} className="btn" aria-label="شحن">شحن</button>
                  <button onClick={()=>refund(o.id)} className="btn" aria-label="استرداد">استرداد</button>
                  <a href={`${apiBase}/api/admin/shipments/${o.shipments?.[0]?.id||''}/label`} className="btn" aria-label="فاتورة">فاتورة</a>
                </div>
                <div style={{ marginTop:6 }}>
                  <select onChange={(e)=>assign(o.id, e.target.value)} className="select" aria-label="تعيين سائق">
                    <option value="">تعيين سائق…</option>
                    {drivers.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
              </td>
            </tr>
          );})}
          {!rows.length && (
            <tr><td colSpan={11} style={{ padding:12, color:'var(--sub)' }}>{busy?'جارٍ التحميل…':'لا توجد نتائج'}</td></tr>
          )}
        </tbody>
      </table>
      </div>

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
              <div key={idx} className="grid" style={{ gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
                <input className="input" placeholder="Product ID" value={it.productId} onChange={(e)=>{ const v=[...coItems]; v[idx].productId=e.target.value; setCoItems(v); }} />
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
                const r = await fetch(`${apiBase}/api/admin/orders`, { method:'POST', headers: { 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
                if (r.ok) { setShowCreate(false); setCoName(''); setCoEmail(''); setCoPhone(''); setCoStreet(''); setCoItems([{ productId:'', quantity:1 }]); await load(); }
              } finally { setCreating(false); }
            }}>{creating?'جارٍ الإنشاء…':'تأكيد'}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

