"use client";
import React from "react";

export default function AnalyticsPage(): JSX.Element {
  const [kpis, setKpis] = React.useState<any>({});
  React.useEffect(()=>{ fetch('/api/admin/analytics').then(r=>r.json()).then(j=>setKpis(j.kpis||{})); },[]);
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>الإحصاءات</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        <Card label="المستخدمون" value={kpis.users ?? '-'} />
        <Card label="الطلبات" value={kpis.orders ?? '-'} />
        <Card label="الإيرادات" value={kpis.revenue ?? '-'} />
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: any }): JSX.Element {
  return (
    <div style={{ background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16 }}>
      <div style={{ color:'#94a3b8', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700 }}>{value}</div>
    </div>
  );
}

// legacy placeholder removed

