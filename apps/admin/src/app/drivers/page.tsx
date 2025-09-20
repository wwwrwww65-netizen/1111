"use client";
import React from 'react';
import { resolveApiBase } from "../lib/apiBase";

export default function DriversPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  // Toolbar state
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'ALL'|'AVAILABLE'|'BUSY'|'OFFLINE'|'DISABLED'>('ALL');
  const [veh, setVeh] = React.useState<string>('ALL');
  const [view, setView] = React.useState<'list'|'map'>('list');
  const [showAdd, setShowAdd] = React.useState(false);
  // Add modal fields
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [nationalId, setNationalId] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState<'دراجة نارية'|'دباب نقل'|''>('');
  const [ownership, setOwnership] = React.useState<'company'|'driver'|''>('');
  const [notes, setNotes] = React.useState('');
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  async function load(){
    const url = new URL(`${apiBase}/api/admin/drivers`);
    if (q) url.searchParams.set('q', q);
    if (status) url.searchParams.set('status', status);
    if (veh) url.searchParams.set('veh', veh);
    const j = await (await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' })).json(); setRows(j.drivers||[]);
  }
  React.useEffect(()=>{ load(); },[apiBase, q, status, veh]);

  async function add(){
    if (!name.trim()) return;
    const payload: any = { name, phone, address: address||undefined, nationalId: nationalId||undefined, vehicleType: vehicleType||undefined, ownership: ownership||undefined, notes: notes||undefined };
    await fetch(`${apiBase}/api/admin/drivers`, { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(payload) });
    setName(''); setPhone(''); setAddress(''); setNationalId(''); setVehicleType(''); setOwnership(''); setNotes('');
    setShowAdd(false);
    await load();
  }

  return (
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>السائقون</h1>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button className="btn" onClick={()=> setShowAdd(true)}>إضافة سائق</button>
          <input className="input" placeholder="بحث: اسم/هاتف/لوحة/مهمة" value={q} onChange={(e)=> setQ(e.target.value)} style={{ minWidth:240 }} />
          <select className="select" value={status} onChange={(e)=> setStatus(e.target.value as any)}>
            <option value="ALL">كل الحالات</option>
            <option value="AVAILABLE">🟢 متاح</option>
            <option value="BUSY">🟡 قيد التوصيل</option>
            <option value="OFFLINE">🔴 غير متصل</option>
            <option value="DISABLED">⛔ معطل</option>
          </select>
          <select className="select" value={veh} onChange={(e)=> setVeh(e.target.value)}>
            <option value="ALL">كل المركبات</option>
            <option value="دراجة نارية">دراجة نارية</option>
            <option value="دباب نقل">دباب نقل</option>
          </select>
          <div className="btn-group">
            <button className={`btn btn-sm ${view==='list'?'':'btn-outline'}`} onClick={()=> setView('list')}>قائمة</button>
            <button className={`btn btn-sm ${view==='map'?'':'btn-outline'}`} onClick={()=> setView('map')}>خريطة</button>
          </div>
          <a className="btn btn-outline btn-sm" href={`${apiBase}/api/admin/drivers/export/csv`}>CSV</a>
          <a className="btn btn-outline btn-sm" href={`${apiBase}/api/admin/drivers/export/xls`}>Excel</a>
          <a className="btn btn-outline btn-sm" href={`${apiBase}/api/admin/drivers/export/pdf`}>PDF</a>
        </div>
      </div>

      {view==='list' && (
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr>
              <th>الاسم</th>
              <th>الهاتف</th>
              <th>النوع</th>
              <th>الملكية</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr></thead>
            <tbody>
              {rows
                .filter((d:any)=>{
                  const t = (q||'').trim();
                  const passQ = !t || [d.name,d.phone,d.plateNumber].some((x:string)=> String(x||'').toLowerCase().includes(t.toLowerCase()));
                  const passStatus = status==='ALL' ? true : (status==='DISABLED' ? d.isActive===false : (d.status===status));
                  const passVeh = veh==='ALL' ? true : d.vehicleType===veh;
                  return passQ && passStatus && passVeh;
                })
                .map((d:any)=> (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.phone||'-'}</td>
                  <td>{d.vehicleType||'-'}</td>
                  <td>{d.ownership==='company'?'ملك الشركة': d.ownership==='driver'?'ملك السائق':'-'}</td>
                  <td><span className="badge">{d.isActive===false?'⛔ معطل': (d.status||'-')}</span></td>
                  <td>
                    <a href={`/drivers/${d.id}`} className="btn btn-outline">عرض</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {view==='map' && (
        <div className="panel" style={{ height: 420, display:'grid', placeItems:'center', color:'var(--sub)', border:'1px solid var(--muted)', borderRadius: 8 }}>
          عرض الخريطة قيد الإعداد (Map view)
        </div>
      )}

      {showAdd && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>إضافة سائق</div>
              <button className="btn btn-sm btn-outline" onClick={()=> setShowAdd(false)}>إغلاق</button>
            </div>
            <div className="modal-body">
              <div className="grid" style={{ gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                <input className="input" placeholder="اسم السائق" value={name} onChange={(e)=>setName(e.target.value)} />
                <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                <input className="input" placeholder="عنوان السكن" value={address} onChange={(e)=>setAddress(e.target.value)} />
                <input className="input" placeholder="البطاقة الشخصية" value={nationalId} onChange={(e)=>setNationalId(e.target.value)} />
                <select className="select" value={vehicleType} onChange={(e)=> setVehicleType(e.target.value as any)}>
                  <option value="">نوع المركبة</option>
                  <option value="دراجة نارية">دراجة نارية</option>
                  <option value="دباب نقل">دباب نقل</option>
                </select>
                <select className="select" value={ownership} onChange={(e)=> setOwnership(e.target.value as any)}>
                  <option value="">ملكية المركبة</option>
                  <option value="company">ملك الشركة</option>
                  <option value="driver">ملك السائق</option>
                </select>
                <input className="input" placeholder="ملاحظات" value={notes} onChange={(e)=>setNotes(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={add}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

