"use client";
import React from 'react';

export default function PaymentMethodsPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  const [name, setName] = React.useState('');
  const [provider, setProvider] = React.useState('cod');
  const [mode, setMode] = React.useState<'TEST'|'LIVE'>('TEST');
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState<number>(0);
  const [feesFixed, setFeesFixed] = React.useState<number|''>('');
  const [feesPercent, setFeesPercent] = React.useState<number|''>('');
  const [minAmount, setMinAmount] = React.useState<number|''>('');
  const [maxAmount, setMaxAmount] = React.useState<number|''>('');
  const [credentials, setCredentials] = React.useState<string>('');
  const [options, setOptions] = React.useState<string>('');

  async function load(){
    setLoading(true); setError('');
    try{ const r = await fetch('/api/admin/payments/gateways', { credentials:'include' }); const j = await r.json(); if (r.ok) setRows(j.gateways||[]); else setError(j.error||'failed'); }
    catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function reset(){ setEditing(null); setName(''); setProvider('cod'); setMode('TEST'); setIsActive(true); setSortOrder(0); setFeesFixed(''); setFeesPercent(''); setMinAmount(''); setMaxAmount(''); setCredentials(''); setOptions(''); }
  function openCreate(){ reset(); setShowForm(true); }
  function openEdit(r:any){ setEditing(r); setName(r.name||''); setProvider(r.provider||''); setMode((r.mode||'TEST')); setIsActive(Boolean(r.isActive)); setSortOrder(Number(r.sortOrder||0)); setFeesFixed(r.feesFixed??''); setFeesPercent(r.feesPercent??''); setMinAmount(r.minAmount??''); setMaxAmount(r.maxAmount??''); setCredentials(r.credentials? JSON.stringify(r.credentials, null, 2):''); setOptions(r.options? JSON.stringify(r.options, null, 2):''); setShowForm(true); }

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    try{
      const payload:any = { name, provider, mode, isActive, sortOrder: Number(sortOrder), feesFixed: feesFixed===''? undefined : Number(feesFixed), feesPercent: feesPercent===''? undefined : Number(feesPercent), minAmount: minAmount===''? undefined : Number(minAmount), maxAmount: maxAmount===''? undefined : Number(maxAmount) };
      if (credentials.trim()) payload.credentials = JSON.parse(credentials);
      if (options.trim()) payload.options = JSON.parse(options);
      let r:Response; if (editing) r = await fetch(`/api/admin/payments/gateways/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/payments/gateways', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error||'failed'); setShowForm(false); reset(); await load();
    }catch(err:any){ setError(err.message||'failed'); }
  }
  async function remove(id:string){ if (!confirm('حذف طريقة الدفع؟')) return; const r = await fetch(`/api/admin/payments/gateways/${id}`, { method:'DELETE', credentials:'include' }); if (r.ok) await load(); }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>طرق الدفع</h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn danger" onClick={async ()=>{
              const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
              for (const id of ids) { try { await fetch(`/api/admin/payments/gateways/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
              setSelected({}); setAllChecked(false); await load(); showToast('تم حذف المحدد');
            }}>حذف المحدد</button>
            <button onClick={openCreate} className="btn">إضافة طريقة</button>
          </div>
        </div>
        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 200 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table" role="table" aria-label="قائمة طرق الدفع">
              <thead><tr><th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(r=> [r.id, v]))); }} /></th><th>الاسم</th><th>المزوّد</th><th>الوضع</th><th>الرسوم</th><th>الحدود</th><th>نشطة</th><th></th></tr></thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td>
                    <td>{r.name}</td>
                    <td>{r.provider}</td>
                    <td>{r.mode}</td>
                    <td>{r.feesFixed??0} + {r.feesPercent??0}%</td>
                    <td>{r.minAmount??'—'} – {r.maxAmount??'—'}</td>
                    <td>{r.isActive? 'نعم' : 'لا'}</td>
                    <td>
                      <button aria-label={`تعديل ${r.name}`} onClick={()=>openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                      <button aria-label={`حذف ${r.name}`} onClick={()=>remove(r.id)} className="btn btn-danger">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل طريقة' : 'إضافة طريقة'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} aria-label="نموذج طريقة الدفع">
              <label>الاسم<input value={name} onChange={(e)=> setName(e.target.value)} required className="input" /></label>
              <label>المزوّد<select value={provider} onChange={(e)=> setProvider(e.target.value)} className="select">
                <option value="cod">الدفع عند الاستلام (COD)</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="tap">Tap</option>
                <option value="hyperpay">HyperPay</option>
              </select></label>
              <label>الوضع<select value={mode} onChange={(e)=> setMode(e.target.value as any)} className="select"><option value="TEST">اختباري</option><option value="LIVE">تشغيلي</option></select></label>
              <label>رسوم ثابتة<input type="number" step="0.01" value={feesFixed} onChange={(e)=> setFeesFixed(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>رسوم نسبة %<input type="number" step="0.01" value={feesPercent} onChange={(e)=> setFeesPercent(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>حد أدنى<input type="number" step="0.01" value={minAmount} onChange={(e)=> setMinAmount(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label>حد أقصى<input type="number" step="0.01" value={maxAmount} onChange={(e)=> setMaxAmount(e.target.value===''?'':Number(e.target.value))} className="input" /></label>
              <label style={{ gridColumn:'1 / -1' }}>المفاتيح/الأسرار (JSON)<textarea value={credentials} onChange={(e)=> setCredentials(e.target.value)} rows={4} className="input" placeholder='{"apiKey":"...","secret":"..."}' /></label>
              <label style={{ gridColumn:'1 / -1' }}>خيارات (JSON)<textarea value={options} onChange={(e)=> setOptions(e.target.value)} rows={4} className="input" placeholder='{"installments":true,"threeDS":true}' /></label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّلة</label>
              <label>الترتيب<input type="number" value={sortOrder} onChange={(e)=> setSortOrder(Number(e.target.value)||0)} className="input" /></label>
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

