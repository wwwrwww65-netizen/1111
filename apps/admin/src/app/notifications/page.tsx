"use client";
import React from 'react';
import { resolveApiBase } from '../lib/apiBase';
import { downloadCsv } from '../lib/csv';
import { exportToXlsx, exportToPdf } from '../lib/export';

export default function NotificationsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [q, setQ] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [channel, setChannel] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [rows, setRows] = React.useState<Array<{id:string;at:string;channel:string;target:string;title:string;status:string;error?:string}>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/notifications/logs`);
    if (q.trim()) url.searchParams.set('q', q.trim());
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);
    if (channel) url.searchParams.set('channel', channel);
    if (status) url.searchParams.set('status', status);
    const j = await (await fetch(url.toString(), { credentials:'include' })).json();
    setRows(j.logs||[]);
    setBusy(false);
  }
  React.useEffect(()=>{ load().catch(()=> setBusy(false)); }, [apiBase, q, from, to, channel, status]);

  function exportCsv(){
    downloadCsv(`notifications_${new Date().toISOString().slice(0,10)}.csv`, [
      ['at','channel','target','title','status','error'],
      ...rows.map(r=> [r.at, r.channel, r.target, r.title, r.status, (r.error||'').replace(/\n/g,' ')])
    ]);
  }

  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">الإشعارات — السجل</h1>
      <div className="toolbar" style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input className="input" placeholder="بحث" value={q} onChange={e=> setQ(e.target.value)} />
        <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} />
        <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} />
        <select className="select" value={channel} onChange={e=> setChannel(e.target.value)}>
          <option value="">كل القنوات</option>
          <option value="EMAIL">Email</option>
          <option value="PUSH">Push</option>
          <option value="SMS">SMS</option>
        </select>
        <select className="select" value={status} onChange={e=> setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          <option value="SENT">مرسل</option>
          <option value="QUEUED">بالطابور</option>
          <option value="FAILED">فشل</option>
        </select>
        <button className="btn btn-sm" onClick={load} disabled={busy}>تحديث</button>
        <button className="btn btn-sm" onClick={exportCsv}>CSV</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToXlsx(`notifications_${new Date().toISOString().slice(0,10)}.xlsx`, ['at','channel','target','title','status','error'], rows.map(r=> [r.at, r.channel, r.target, r.title, r.status, r.error||'']))}>Excel</button>
        <button className="btn btn-sm btn-outline" onClick={()=> exportToPdf(`notifications_${new Date().toISOString().slice(0,10)}.pdf`, ['at','channel','target','title','status','error'], rows.map(r=> [r.at, r.channel, r.target, r.title, r.status, r.error||'']))}>PDF</button>
      </div>
      <div className="mt-3" style={{overflowX:'auto'}}>
        <table className="table">
          <thead><tr><th>التاريخ</th><th>القناة</th><th>الهدف</th><th>العنوان</th><th>الحالة</th><th>الخطأ</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=> (
              <tr key={r.id}><td>{String(r.at).slice(0,19).replace('T',' ')}</td><td>{r.channel}</td><td>{r.target}</td><td>{r.title}</td><td>{r.status}</td><td>{r.error||'—'}</td></tr>
            )): (<tr><td colSpan={6}>{busy? 'جارٍ التحميل…':'لا توجد بيانات'}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

