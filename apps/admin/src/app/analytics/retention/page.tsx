"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";

export default function RetentionCohortsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState(true);

  React.useEffect(()=>{ (async()=>{
    try{ const j = await (await fetch(`${apiBase}/api/admin/analytics/cohorts`, { credentials:'include' })).json(); setRows(j.cohorts||[]); }
    finally{ setBusy(false); }
  })(); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>الاحتفاظ Cohorts</h1>
        <div style={{ marginTop:12 }}>
          <table className="table" role="table" aria-label="Cohorts">
            <thead><tr><th>الأسبوع</th><th>مستخدمون جدد</th><th>طلبات W+1</th><th>طلبات W+2</th></tr></thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.weekStart}><td>{r.weekStart}</td><td>{r.newUsers}</td><td>{r.week1Orders}</td><td>{r.week2Orders}</td></tr>
              ))}
              {!rows.length && !busy && (<tr><td colSpan={4} style={{ color:'var(--sub)' }}>لا توجد بيانات</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


