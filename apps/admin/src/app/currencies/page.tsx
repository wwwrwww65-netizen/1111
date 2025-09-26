"use client";
import React from 'react';

export default function CurrenciesPage(): JSX.Element {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [q, setQ] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any|null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [allChecked, setAllChecked] = React.useState(false);
  const [toast, setToast] = React.useState<string>('');
  const showToast = (m:string)=>{ setToast(m); setTimeout(()=> setToast(''), 1600); };

  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [symbol, setSymbol] = React.useState('');
  const [precision, setPrecision] = React.useState<number>(2);
  const [rateToBase, setRateToBase] = React.useState<number>(1);
  const [isBase, setIsBase] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  async function load() {
    setLoading(true); setError('');
    try{
      const r = await fetch('/api/admin/currencies', { credentials:'include' });
      const j = await r.json();
      if (r.ok) setRows(j.currencies||[]); else setError(j.error||'failed');
    }catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function resetForm() {
    setEditing(null); setName(''); setCode(''); setSymbol(''); setPrecision(2); setRateToBase(1); setIsBase(false); setIsActive(true);
  }
  function openCreate() { resetForm(); setShowForm(true); }
  function openEdit(row:any) {
    setEditing(row);
    setName(row.name||''); setCode(row.code||''); setSymbol(row.symbol||''); setPrecision(Number(row.precision||2)); setRateToBase(Number(row.rateToBase||1)); setIsBase(Boolean(row.isBase)); setIsActive(Boolean(row.isActive));
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try{
      const payload = { name, code: code.trim().toUpperCase(), symbol, precision: Number(precision), rateToBase: Number(rateToBase), isBase, isActive };
      let r: Response; if (editing) r = await fetch(`/api/admin/currencies/${editing.id}`, { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      else r = await fetch('/api/admin/currencies', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error||'failed');
      setShowForm(false); resetForm(); await load();
      alert('تم الحفظ');
    }catch(err:any){ setError(err.message||'failed'); }
  }

  async function remove(id:string) {
    if (!confirm('حذف العملة؟')) return;
    const r = await fetch(`/api/admin/currencies/${id}`, { method:'DELETE', credentials:'include' });
    if (r.ok) { showToast('تم الحذف'); await load(); }
  }

  const filtered = rows.filter(r=> !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.code?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        {toast && (<div className="toast ok" style={{ marginBottom:8 }}>{toast}</div>)}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h1 style={{ margin:0 }}>العملات</h1>
          <button onClick={openCreate} className="btn">إضافة عملة</button>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={q} onChange={(e)=> setQ(e.target.value)} placeholder="بحث بالاسم/الكود" className="input" style={{ maxWidth:260 }} />
          <button className="btn danger" onClick={async ()=>{
            const ids = Object.keys(selected).filter(id=> selected[id]); if (!ids.length) return;
            for (const id of ids) { try { await fetch(`/api/admin/currencies/${id}`, { method:'DELETE', credentials:'include' }); } catch {} }
            setSelected({}); setAllChecked(false); showToast('تم حذف المحدد'); await load();
          }}>حذف المحدد</button>
        </div>
        {loading ? <div>جارِ التحميل…</div> : error ? <div className="error">فشل: {error}</div> : (
          <div style={{ overflowX:'auto' }}>
            <table className="table">
              <thead><tr>
                <th><input type="checkbox" checked={allChecked} onChange={(e)=>{ const v=e.target.checked; setAllChecked(v); setSelected(Object.fromEntries(rows.map(r=> [r.id, v]))); }} /></th><th>الاسم</th><th>الكود</th><th>الرمز</th><th>الدقة</th><th>المعدل إلى الأساس</th><th>الأساس؟</th><th>مفعّلة</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(r=> (
                  <tr key={r.id}>
                    <td><input type="checkbox" checked={!!selected[r.id]} onChange={()=> setSelected(s=> ({...s, [r.id]: !s[r.id]}))} /></td>
                    <td>{r.name}</td>
                    <td>{r.code}</td>
                    <td>{r.symbol}</td>
                    <td>{r.precision}</td>
                    <td>{r.rateToBase}</td>
                    <td>{r.isBase? 'نعم':'لا'}</td>
                    <td>{r.isActive? 'نعم':'لا'}</td>
                    <td>
                      <button onClick={()=> openEdit(r)} className="btn btn-outline" style={{ marginInlineEnd:6 }}>تعديل</button>
                      <button onClick={()=> remove(r.id)} className="btn btn-danger">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div className="panel" style={{ marginTop:16, padding:16 }}>
            <h2 style={{ marginTop:0 }}>{editing? 'تعديل عملة' : 'إضافة عملة'}</h2>
            <form onSubmit={submit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <label>الاسم<input value={name} onChange={(e)=> setName(e.target.value)} required className="input" /></label>
              <label>الكود<input value={code} onChange={(e)=> setCode(e.target.value)} required className="input" placeholder="SAR, USD" /></label>
              <label>الرمز<input value={symbol} onChange={(e)=> setSymbol(e.target.value)} required className="input" placeholder="ر.س, $" /></label>
              <label>الدقة<input type="number" value={precision} onChange={(e)=> setPrecision(Number(e.target.value)||0)} min={0} max={6} className="input" /></label>
              <label>المعدل إلى الأساس<input type="number" step="0.0001" value={rateToBase} onChange={(e)=> setRateToBase(Number(e.target.value)||1)} className="input" /></label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isBase} onChange={(e)=> setIsBase(e.target.checked)} /> اجعلها عملة الأساس</label>
              <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={isActive} onChange={(e)=> setIsActive(e.target.checked)} /> مفعّلة</label>
              <div style={{ gridColumn:'1 / -1', display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="submit" className="btn">حفظ</button>
                <button type="button" onClick={()=> { setShowForm(false); resetForm(); }} className="btn btn-outline">إلغاء</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

