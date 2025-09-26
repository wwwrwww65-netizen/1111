"use client";
import React from 'react';

export default function ShippingRatesPage(): JSX.Element {
  const [zones, setZones] = React.useState<any[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  const [zoneId, setZoneId] = React.useState('');
  const [carrier, setCarrier] = React.useState('');
  const [baseFee, setBaseFee] = React.useState<number>(0);
  const [perKgFee, setPerKgFee] = React.useState<number|''>('');
  const [minWeightKg, setMinWeightKg] = React.useState<number|''>('');
  const [maxWeightKg, setMaxWeightKg] = React.useState<number|''>('');
  const [minSubtotal, setMinSubtotal] = React.useState<number|''>('');
  const [freeOverSubtotal, setFreeOverSubtotal] = React.useState<number|''>('');
  const [etaMinHours, setEtaMinHours] = React.useState<number|''>('');
  const [etaMaxHours, setEtaMaxHours] = React.useState<number|''>('');
  const [offerTitle, setOfferTitle] = React.useState('');
  const [activeFrom, setActiveFrom] = React.useState<string>('');
  const [activeUntil, setActiveUntil] = React.useState<string>('');
  const [isActive, setIsActive] = React.useState(true);

  async function load(){
    setLoading(true); setError('');
    try{ const z = await fetch('/api/admin/shipping/zones', { credentials:'include' }); const zj = await z.json(); if (z.ok) setZones(zj.zones||[]);
      const r = await fetch('/api/admin/shipping/rates', { credentials:'include' }); const j = await r.json(); if (r.ok) setRows(j.rates||[]); else setError(j.error||'failed');
    }catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function reset(){ setEditing(null); setZoneId(''); setCarrier(''); setBaseFee(0); setPerKgFee(''); setMinWeightKg(''); setMaxWeightKg(''); setMinSubtotal(''); setFreeOverSubtotal(''); setEtaMinHours(''); setEtaMaxHours(''); setOfferTitle(''); setActiveFrom(''); setActiveUntil(''); setIsActive(true); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ setEditing(r); setZoneId(r.zoneId||''); setCarrier(r.carrier||''); setBaseFee(Number(r.baseFee||0)); setPerKgFee(r.perKgFee??''); setMinWeightKg(r.minWeightKg??''); setMaxWeightKg(r.maxWeightKg??''); setMinSubtotal(r.minSubtotal??''); setFreeOverSubtotal(r.freeOverSubtotal??''); setEtaMinHours(r.etaMinHours??''); setEtaMaxHours(r.etaMaxHours??''); setOfferTitle(r.offerTitle||''); setActiveFrom(r.activeFrom? String(r.activeFrom).slice(0,16):''); setActiveUntil(r.activeUntil? String(r.activeUntil).slice(0,16):''); setIsActive(Boolean(r.isActive)); setShowForm(true); }

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    try{
      const payload:any = { zoneId, carrier: carrier||undefined, baseFee: Number(baseFee), perKgFee: perKgFee===''? undefined : Number(perKgFee), minWeightKg: minWeightKg===''? undefined : Number(minWeightKg), maxWeightKg: maxWeightKg===''? undefined : Number(maxWeightKg), minSubtotal: minSubtotal===''? undefined : Number(minSubtotal), freeOverSubtotal: freeOverSubtotal===''? undefined : Number(freeOverSubtotal), etaMinHours: etaMinHours===''? undefined : Number(etaMinHours), etaMaxHours: etaMaxHours===''? undefined : Number(etaMaxHours), offerTitle: offerTitle||undefined, activeFrom: activeFrom||undefined, activeUntil: activeUntil||undefined, isActive };
      let r:Response; if (editing) r = await fetch(`/api/admin/shipping/rates/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/shipping/rates', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error||'failed'); setShowForm(false); reset(); await load();
    }catch(err:any){ setError(err.message||'failed'); }
  }

  async function remove(id:string){ if (!confirm('حذف السعر؟')) return; const r = await fetch(`/api/admin/shipping/rates/${id}`, { method:'DELETE', credentials:'include' }); if (r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>أسعار التوصيل</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/shipping/rates/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة سعر</button>
          </div>
        </div>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 200 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="قائمة أسعار التوصيل">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(r=> [r.id, v]))); }} /></th><th>المنطقة</th><th>المشغل</th><th>الرسوم الأساسية</th><th>لكل كجم</th><th>مجاني فوق</th><th>ETA</th><th>نشط</th><th></th></tr></thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td>
                    <td>{zones.find(z=>z.id===r.zoneId)?.name || r.zoneId}</td>
                    <td>{r.carrier||'—'}</td>
                    <td>{r.baseFee}</td>
                    <td>{r.perKgFee??'—'}</td>
                    <td>{r.freeOverSubtotal??'—'}</td>
                    <td>{r.etaMinHours? `${r.etaMinHours}-${r.etaMaxHours||r.etaMinHours} ساعة` : '—'}</td>
                    <td>{r.isActive? 'نعم':'لا'}</td>
                    <td>
                      <button aria-label={`تعديل سعر ${zones.find(z=>z.id===r.zoneId)?.name||''}`} onClick={()=>openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                      <button aria-label={`حذف سعر ${zones.find(z=>z.id===r.zoneId)?.name||''}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل سعر' : 'إضافة سعر'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} aria-label="نموذج سعر التوصيل">
              <label>المنطقة
                <select value={zoneId} onChange={(e)=> setZoneId(e.target.value)} required className="select">
                  <option value="">اختر منطقة</option>
                  {zones.map(z=> (<option key={z.id} value={z.id}>{z.name}</option>))}
                </select>
              </label>
              <label>المشغل (اختياري)<input value={carrier} onChange={(e)=> setCarrier(e.target.value)} className="input" /></label>
              <label>الرسوم الأساسية<input type="number" step="0.01" value={baseFee} onChange={(e)=> setBaseFee(Number(e.target.value)||0)} className="input" required /></label>
              <label>لكل كجم<input type="number" step="0.01" value={perKgFee} onChange={(e)=> setPerKgFee(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>الوزن الأدنى (كجم)<input type="number" step="0.01" value={minWeightKg} onChange={(e)=> setMinWeightKg(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>الوزن الأقصى (كجم)<input type="number" step="0.01" value={maxWeightKg} onChange={(e)=> setMaxWeightKg(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>المجموع الأدنى للطلب<input type="number" step="0.01" value={minSubtotal} onChange={(e)=> setMinSubtotal(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>شحن مجاني فوق<input type="number" step="0.01" value={freeOverSubtotal} onChange={(e)=> setFreeOverSubtotal(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>ETA (ساعات) من<input type="number" value={etaMinHours} onChange={(e)=> setEtaMinHours(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>ETA (ساعات) إلى<input type="number" value={etaMaxHours} onChange={(e)=> setEtaMaxHours(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>عنوان العرض (اختياري)<input value={offerTitle} onChange={(e)=> setOfferTitle(e.target.value)} className="input" /></label>
              <label>ساري من<input type="datetime-local" value={activeFrom} onChange={(e)=> setActiveFrom(e.target.value)} className="input" /></label>
              <label>ساري إلى<input type="datetime-local" value={activeUntil} onChange={(e)=> setActiveUntil(e.target.value)} className="input" /></label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّل</label>
              <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="submit" className="btn">حفظ</button>
                <button type="button" onClick={()=> { setShowForm(false); reset(); }} className="btn btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

