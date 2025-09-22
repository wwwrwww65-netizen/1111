"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function WalletManagement(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [rows, setRows] = React.useState<Array<{id:string;user:string;balance:number;lastTxnAt?:string}>>([]);
  const [busy, setBusy] = React.useState(false);
  const [showTxn, setShowTxn] = React.useState(false);
  const [form, setForm] = React.useState<{userId:string;type:'TOPUP'|'WITHDRAW';amount:string;note?:string}>({ userId:"", type:'TOPUP', amount:"" });

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/wallet/accounts`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.accounts||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q, from, to]);

  async function submitTxn(e: React.FormEvent){
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/admin/wallet/txn`, { method:'POST', credentials:'include', headers:{'content-type':'application/json'}, body: JSON.stringify({
      userId: form.userId,
      type: form.type,
      amount: Number(form.amount||0),
      note: form.note||undefined
    }) });
    if (!res.ok) { alert('تعذر تسجيل العملية'); return; }
    setShowTxn(false); setForm({ userId:"", type:'TOPUP', amount:"" });
    await load();
  }

  function exportCsv(){
    const lines = [
      ['user','balance','lastTxnAt'],
      ...rows.map(r=> [r.user, String(r.balance), r.lastTxnAt? String(r.lastTxnAt).slice(0,19).replace('T',' '):''])
    ];
    const csv = lines.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `wallet_accounts_${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">محفظة العملاء</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث: اسم/بريد" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={()=> setShowTxn(true)}>+ إيداع/سحب</button>
        <button className="btn btn-sm" onClick={exportCsv}>تصدير CSV</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>المستخدم</th><th>الرصيد</th><th>آخر عملية</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.id}><td>{r.user}</td><td>{r.balance.toFixed(2)}</td><td>{r.lastTxnAt? String(r.lastTxnAt).slice(0,19).replace('T',' '): '—'}</td></tr>
            )): (<tr><td colSpan={3}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>

      {showTxn && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-content">
            <h3 className="text-lg mb-2">إيداع/سحب</h3>
            <form onSubmit={submitTxn} className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <label className="grid" style={{gap:4}}>
                <span>معرّف المستخدم</span>
                <input className="input" value={form.userId} onChange={e=> setForm(f=> ({...f, userId: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>النوع</span>
                <select className="input" value={form.type} onChange={e=> setForm(f=> ({...f, type: e.target.value as any}))}>
                  <option value="TOPUP">إيداع</option>
                  <option value="WITHDRAW">سحب</option>
                </select>
              </label>
              <label className="grid" style={{gap:4}}>
                <span>المبلغ</span>
                <input className="input" type="number" step="0.01" required value={form.amount} onChange={e=> setForm(f=> ({...f, amount: e.target.value}))} />
              </label>
              <label className="grid" style={{gap:4}}>
                <span>ملاحظات</span>
                <input className="input" value={form.note||''} onChange={e=> setForm(f=> ({...f, note: e.target.value||undefined}))} />
              </label>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',gridColumn:'1 / -1'}}>
                <button type="button" className="btn btn-outline" onClick={()=> setShowTxn(false)}>إلغاء</button>
                <button type="submit" className="btn">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

