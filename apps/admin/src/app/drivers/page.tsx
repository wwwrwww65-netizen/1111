"use client";
import React from 'react';
import { resolveApiBase } from "../lib/apiBase";

export default function DriversPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  // Toolbar state
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'ALL'|'AVAILABLE'|'BUSY'|'OFFLINE'|'DISABLED'>('ALL');
  const [veh, setVeh] = React.useState<string>('ALL');
  const [tab, setTab] = React.useState<'list'|'map'|'add'>('list');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = React.useState<'name'|'phone'|'vehicleType'|'status'>('name');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('asc');
  const mapRef = React.useRef<HTMLDivElement|null>(null);
  const mapObjRef = React.useRef<any>(null);
  const markersRef = React.useRef<any[]>([]);
  const [focusedId, setFocusedId] = React.useState<string>('');
  const [msg, setMsg] = React.useState<string>('');
  const [ioConnected, setIoConnected] = React.useState(false);
  // Add modal fields
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [nationalId, setNationalId] = React.useState('');
  const [idType, setIdType] = React.useState<'ID'|'PASSPORT'>('ID');
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

  const [loading, setLoading] = React.useState(false);
  async function load(){
    try {
      setMsg(''); setLoading(true);
      const base = resolveApiBase();
      const url = new URL(`/api/admin/drivers`, base);
      if (q) url.searchParams.set('q', q);
      if (status) url.searchParams.set('status', status);
      if (veh) url.searchParams.set('veh', veh);
      const resp = await fetch(url.toString(), { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' });
      if (!resp.ok) { setMsg(`فشل تحميل السائقين (${resp.status})`); setRows([]); return; }
      const j = await resp.json(); setRows(j.drivers||[]);
    } catch (e:any) {
      setMsg('تعذر الاتصال بالخادم'); setRows([]);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load(); },[apiBase, q, status, veh]);

  // Ensure MapLibre on map view
  React.useEffect(()=>{
    let cancelled = false;
    async function ensureMap(){
      if (tab !== 'map') return;
      if (!mapRef.current) return;
      if (!(window as any).maplibregl) {
        const link = document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.css'; document.head.appendChild(link);
        await new Promise<void>((resolve)=>{ const s=document.createElement('script'); s.src='https://unpkg.com/maplibre-gl@2.4.0/dist/maplibre-gl.js'; s.onload=()=> resolve(); document.body.appendChild(s); });
      }
      if (cancelled) return;
      if (!mapObjRef.current && (window as any).maplibregl) {
        const maplibregl = (window as any).maplibregl;
        mapObjRef.current = new maplibregl.Map({ container: mapRef.current!, style: 'https://demotiles.maplibre.org/style.json', center: [46.6753, 24.7136], zoom: 6 });
      }
    }
    ensureMap();
    return ()=> { cancelled = true; };
  }, [tab]);

  // Update markers when rows or filters change
  React.useEffect(()=>{
    if (tab !== 'map') return;
    if (!mapObjRef.current || !(window as any).maplibregl) return;
    for (const m of markersRef.current) { try { m.remove(); } catch {} }
    markersRef.current = [];
    const maplibregl = (window as any).maplibregl;
    const filtered = rows.filter((d:any)=>{
      const t = (q||'').trim();
      const passQ = !t || [d.name,d.phone,d.plateNumber].some((x:string)=> String(x||'').toLowerCase().includes(t.toLowerCase()));
      const passStatus = status==='ALL' ? true : (status==='DISABLED' ? d.isActive===false : (d.status===status));
      const passVeh = veh==='ALL' ? true : d.vehicleType===veh;
      return passQ && passStatus && passVeh;
    });
    let firstSet = false;
    for (const d of filtered) {
      if (typeof d.lng !== 'number' || typeof d.lat !== 'number') continue;
      const el = document.createElement('div'); el.style.width='12px'; el.style.height='12px'; el.style.borderRadius='50%'; el.style.cursor='pointer';
      el.style.background = (d.isActive===false)? '#6b7280' : (d.status==='AVAILABLE'? '#22c55e' : d.status==='BUSY'? '#f59e0b' : '#ef4444');
      el.title = d.name || '';
      const mk = new maplibregl.Marker({ element: el }).setLngLat([d.lng, d.lat]).addTo(mapObjRef.current);
      el.onclick = ()=> { setFocusedId(d.id); try { mapObjRef.current.easeTo({ center: [d.lng, d.lat], zoom: Math.max(10, mapObjRef.current.getZoom()) }); } catch {} };
      markersRef.current.push(mk);
      if (!firstSet) { try { mapObjRef.current.easeTo({ center: [d.lng, d.lat], zoom: 9 }); } catch {} firstSet=true; }
    }
  }, [rows, q, status, veh, tab]);

  // Realtime via Socket.IO
  React.useEffect(()=>{
    let socket: any;
    try {
      // Lazy load socket.io client from CDN to avoid bundling
      const ensure = async ()=>{
        if (!(window as any).io) {
          await new Promise<void>((resolve)=>{ const s=document.createElement('script'); s.src='https://cdn.socket.io/4.7.2/socket.io.min.js'; s.onload=()=> resolve(); document.body.appendChild(s); });
        }
        const base = new URL(apiBase);
        const origin = base.origin || apiBase;
        socket = (window as any).io(origin, { transports:['websocket'], withCredentials:true });
        socket.on('connect', ()=> setIoConnected(true));
        socket.on('disconnect', ()=> setIoConnected(false));
        socket.on('driver:locations', (payload:any)=>{
          // Merge live locations into rows
          const map = new Map(rows.map((r:any)=> [r.id, r]));
          for (const d of (payload?.drivers||[])) { const cur = map.get(d.id) || {}; map.set(d.id, { ...cur, ...d }); }
          setRows(Array.from(map.values()));
        });
      };
      ensure();
    } catch {}
    return ()=> { try { socket && socket.disconnect(); } catch {} };
  }, [apiBase]);

  function toggleAll(checked: boolean){
    const next: Record<string, boolean> = {};
    if (checked) for (const d of rows) next[d.id] = true;
    setSelected(next);
  }
  function toggleOne(id: string, checked: boolean){ setSelected(prev=> ({ ...prev, [id]: checked })); }
  function onSort(key: 'name'|'phone'|'vehicleType'|'status'){ if (sortBy===key) setSortDir(sortDir==='asc'?'desc':'asc'); else { setSortBy(key); setSortDir('asc'); } }

  function exportSelectedCSV(){
    const sel = rows.filter((r:any)=> selected[r.id]);
    const arr = (sel.length? sel : rows).map((d:any)=> ({ id:d.id, name:d.name, phone:d.phone||'', vehicleType:d.vehicleType||'', ownership:d.ownership||'', status: d.isActive===false?'DISABLED':(d.status||''), lat:d.lat||'', lng:d.lng||'' }));
    const header = 'id,name,phone,vehicleType,ownership,status,lat,lng\n';
    const body = arr.map(r=> [r.id,r.name,r.phone,r.vehicleType,r.ownership,r.status,r.lat,r.lng].map(v=> String(v).replace(/"/g,'""')).map(v=> (/[,\n]/.test(v)? '"'+v+'"' : v)).join(',')).join('\n');
    const blob = new Blob([header+body], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='drivers_selected.csv'; a.click(); URL.revokeObjectURL(url);
  }

  async function toggleActive(d:any){
    const payload = { isActive: !(d.isActive!==false) } as any;
    await fetch(`/api/admin/drivers/${d.id}`, { method:'PATCH', headers:{ 'content-type':'application/json', ...authHeaders() }, credentials:'include', body: JSON.stringify(payload) });
    await load();
  }

  async function add(){
    setMsg('');
    if (!name.trim()) { setMsg('أدخل اسم السائق'); return; }
    const payload: any = { name, phone, isActive: true, status: 'AVAILABLE', address: address||undefined, nationalId: nationalId||undefined, vehicleType: vehicleType||undefined, ownership: ownership||undefined, notes: notes||undefined };
    try {
      const url = new URL(`/api/admin/drivers`, resolveApiBase());
      const resp = await fetch(url.toString(), { method:'POST', headers:{'content-type':'application/json', ...authHeaders()}, credentials:'include', body: JSON.stringify(payload) });
      if (!resp.ok) { const txt = await resp.text().catch(()=> ''); setMsg(`تعذر الإضافة (${resp.status}) ${txt.slice(0,120)}`); return; }
      setName(''); setPhone(''); setAddress(''); setNationalId(''); setVehicleType(''); setOwnership(''); setNotes(''); setIdType('ID');
      setShowAdd(false);
      await load();
    } catch {
      setMsg('تعذر الاتصال بالخادم أثناء الإضافة');
    }
  }

  const [dense, setDense] = React.useState<boolean>(()=>{ try { return localStorage.getItem('dense')==='1'; } catch { return false;} });
  React.useEffect(()=>{ try { localStorage.setItem('dense', dense?'1':'0'); } catch{} },[dense]);
  return (
    <main className="panel">
      <div style={{ display:'grid', placeItems:'center', marginBottom:8 }}>
        <div className="btn-group">
          <button className={`btn btn-sm ${tab==='list'?'':'btn-outline'}`} onClick={()=> setTab('list')}>القائمة</button>
          <button className={`btn btn-sm ${tab==='map'?'':'btn-outline'}`} onClick={()=> setTab('map')}>الخريطة</button>
          <button className={`btn btn-sm ${tab==='add'?'':'btn-outline'}`} onClick={()=> setTab('add')}>إضافة سائق</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', marginBottom:12 }}>
        <input className="input" placeholder="بحث: اسم/هاتف/لوحة/مهمة" value={q} onChange={(e)=> setQ(e.target.value)} style={{ minWidth:260 }} />
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
        <a className="btn btn-outline btn-sm" href={`/api/admin/drivers/export/csv`}>CSV</a>
        <a className="btn btn-outline btn-sm" href={`/api/admin/drivers/export/xls`}>Excel</a>
        <a className="btn btn-outline btn-sm" href={`/api/admin/drivers/export/pdf`}>PDF</a>
        <button className="btn btn-outline btn-sm" onClick={()=> setDense(v=>!v)}>{dense? 'كثافة عادية' : 'كثافة مضغوطة'}</button>
      </div>
      {msg && <div className="panel" style={{ color:'#fca5a5', marginBottom:8 }}>{msg}</div>}

      {tab==='list' && (
        <div style={{ overflowX:'auto' }}>
          {loading && (<div className="panel"><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8, marginBottom:8 }} /><div style={{ height:48, background:'var(--muted2)', borderRadius:8 }} /></div>)}
          {!loading && rows.length===0 && !msg && (<div className="panel" style={{ display:'grid', placeItems:'center', padding:24, color:'var(--sub)' }}>لا سائقين</div>)}
          <table className="table" style={dense? { } : {}}>
            <thead><tr>
              <th><input type="checkbox" onChange={(e)=> toggleAll(e.currentTarget.checked)} /></th>
              <th><button className="link" onClick={()=> onSort('name')}>الاسم {sortBy==='name'?(sortDir==='asc'?'▲':'▼'):''}</button></th>
              <th><button className="link" onClick={()=> onSort('phone')}>الهاتف {sortBy==='phone'?(sortDir==='asc'?'▲':'▼'):''}</button></th>
              <th><button className="link" onClick={()=> onSort('vehicleType')}>النوع {sortBy==='vehicleType'?(sortDir==='asc'?'▲':'▼'):''}</button></th>
              <th>الملكية</th>
              <th><button className="link" onClick={()=> onSort('status')}>الحالة {sortBy==='status'?(sortDir==='asc'?'▲':'▼'):''}</button></th>
              <th>آخر موقع</th>
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
                .sort((a:any,b:any)=> {
                  const dir = sortDir==='asc'? 1 : -1;
                  const ka = String(a[sortBy]||''); const kb = String(b[sortBy]||'');
                  return ka.localeCompare(kb,'ar') * dir;
                })
                .map((d:any)=> (
                <tr key={d.id}>
                  <td><input type="checkbox" checked={!!selected[d.id]} onChange={(e)=> toggleOne(d.id, e.currentTarget.checked)} /></td>
                  <td>{d.name}</td>
                  <td>{d.phone||'-'}</td>
                  <td>{d.vehicleType||'-'}</td>
                  <td>{d.ownership==='company'?'ملك الشركة': d.ownership==='driver'?'ملك السائق':'-'}</td>
                  <td><span className="badge">{d.isActive===false?'⛔ معطل': (d.status||'-')}</span></td>
                  <td>{(d.lat!=null&&d.lng!=null)? `${d.lat.toFixed?.(4)||d.lat}, ${d.lng.toFixed?.(4)||d.lng}` : '—'}</td>
                  <td style={{ display:'flex', gap:6 }}>
                    <a href={`tel:${d.phone||''}`} className="btn btn-sm">📞</a>
                    <a href={`sms:${d.phone||''}`} className="btn btn-sm btn-outline">✉️</a>
                    <button className="btn btn-sm btn-outline" onClick={()=> toggleActive(d)}>{d.isActive===false?'تفعيل':'تعليق'}</button>
                    <a href={`/drivers/${d.id}`} className="btn btn-sm">عرض</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop:8 }}>
            <button className="btn btn-outline btn-sm" onClick={exportSelectedCSV}>تصدير المحدد (CSV)</button>
          </div>
        </div>
      )}
      {tab==='map' && (
        <div className="grid" style={{ gridTemplateColumns:'1fr 320px', gap:12, alignItems:'stretch' }}>
          <div className="panel" style={{ height: 420, padding:0 }}>
            <div ref={mapRef} style={{ width:'100%', height:'100%', borderRadius:8 }} />
          </div>
          <div className="panel" style={{ height: 420, overflowY:'auto' }}>
            <h3 style={{ marginTop:0 }}>السائقون على الخريطة</h3>
            <div style={{ display:'grid', gap:8 }}>
              {rows.filter((d:any)=>{
                const t = (q||'').trim();
                const passQ = !t || [d.name,d.phone,d.plateNumber].some((x:string)=> String(x||'').toLowerCase().includes(t.toLowerCase()));
                const passStatus = status==='ALL' ? true : (status==='DISABLED' ? d.isActive===false : (d.status===status));
                const passVeh = veh==='ALL' ? true : d.vehicleType===veh;
                return passQ && passStatus && passVeh;
              }).map((d:any)=> (
                <div key={d.id} className={`card ${focusedId===d.id?'active':''}`} style={{ display:'grid', gap:4, padding:8, border:'1px solid var(--muted)', borderRadius:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontWeight:600 }}>{d.name}</div>
                    <span className="badge">{d.isActive===false?'⛔ معطل': (d.status||'-')}</span>
                  </div>
                  <div style={{ color:'var(--sub)', fontSize:12 }}>{d.phone||'-'} • {d.vehicleType||'-'}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-sm" onClick={()=> { setFocusedId(d.id); if (typeof d.lng==='number' && typeof d.lat==='number') { try { mapObjRef.current.easeTo({ center:[d.lng,d.lat], zoom: Math.max(11, mapObjRef.current.getZoom()) }); } catch {} } }}>تركيز</button>
                    <a className="btn btn-sm btn-outline" href={`tel:${d.phone||''}`}>اتصال</a>
                    <a className="btn btn-sm btn-outline" href={`/drivers/${d.id}`}>تفاصيل</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='add' && (
        <div className="panel" style={{ marginTop:8 }}>
          <div className="grid" style={{ gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
            <input className="input" placeholder="اسم السائق" value={name} onChange={(e)=>setName(e.target.value)} />
            <input className="input" placeholder="رقم الهاتف" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            <input className="input" placeholder="عنوان السكن" value={address} onChange={(e)=>setAddress(e.target.value)} />
            <select className="select" value={idType} onChange={(e)=> setIdType(e.target.value as any)}>
              <option value="ID">نوع الهوية: بطاقة شخصية</option>
              <option value="PASSPORT">نوع الهوية: جواز سفر</option>
            </select>
            <input className="input" placeholder={idType==='ID'? 'بطاقة شخصية' : 'جواز سفر'} value={nationalId} onChange={(e)=>setNationalId(e.target.value)} />
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
          <div style={{ marginTop:8 }}>
            <button className="btn" onClick={add}>حفظ</button>
          </div>
        </div>
      )}
    </main>
  );
}

