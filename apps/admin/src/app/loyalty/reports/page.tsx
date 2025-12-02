"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function PointsReportsPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [from, setFrom] = React.useState<string>(new Date(Date.now()-30*864e5).toISOString().slice(0,10));
  const [to, setTo] = React.useState<string>(new Date().toISOString().slice(0,10));
  const [rows, setRows] = React.useState<Array<{d:string;earned:number;redeemed:number}>>([]);
  const [top, setTop] = React.useState<Array<{reason:string;earned:number;redeemed:number}>>([]);
  const [busy, setBusy] = React.useState(false);
  async function load(){
    setBusy(true);
    const url = new URL(`${apiBase}/api/admin/points/summary`);
    url.searchParams.set('from', `${from}T00:00:00Z`);
    url.searchParams.set('to', `${to}T23:59:59Z`);
    try{ const j = await (await fetch(url.toString(), { credentials:'include' })).json(); setRows(j.series||[]); setTop(j.topReasons||[]); }catch{ setRows([]); setTop([]); }
    setBusy(false);
  }
  React.useEffect(()=>{ void load(); }, [apiBase]);

  const totalEarned = rows.reduce((s,r)=> s+Number(r.earned||0), 0);
  const totalRedeemed = rows.reduce((s,r)=> s+Number(r.redeemed||0), 0);

  return (
    <main>
      <h1 style={{marginBottom:12}}>تقارير النقاط</h1>
      <div className="panel" style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
        <label>من <input className="input" type="date" value={from} onChange={e=> setFrom(e.target.value)} /></label>
        <label>إلى <input className="input" type="date" value={to} onChange={e=> setTo(e.target.value)} /></label>
        <button className="btn" onClick={load} disabled={busy}>تحديث</button>
        <div style={{marginInlineStart:'auto'}}><strong>المكتسب:</strong> {totalEarned} &nbsp; | &nbsp; <strong>المستبدل:</strong> {totalRedeemed}</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns:'2fr 1fr', gap:12, marginTop:12 }}>
        <div className="panel">
          <h3 style={{marginTop:0}}>سلسلة يومية</h3>
          <table className="table">
            <thead><tr><th>اليوم</th><th>مكتسب</th><th>مستبدل</th></tr></thead>
            <tbody>
              {rows.map((r,i)=> (<tr key={i}><td>{String(r.d).slice(0,10)}</td><td>{r.earned}</td><td>{r.redeemed}</td></tr>))}
              {!rows.length && (<tr><td colSpan={3}>{busy? 'جارٍ التحميل…' : 'لا توجد بيانات'}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3 style={{marginTop:0}}>أبرز الأسباب</h3>
          <table className="table">
            <thead><tr><th>السبب</th><th>مكتسب</th><th>مستبدل</th></tr></thead>
            <tbody>
              {top.map((r,i)=> (<tr key={i}><td>{r.reason||'—'}</td><td>{r.earned}</td><td>{r.redeemed}</td></tr>))}
              {!top.length && (<tr><td colSpan={3}>{busy? 'جارٍ التحميل…' : 'لا توجد بيانات'}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


