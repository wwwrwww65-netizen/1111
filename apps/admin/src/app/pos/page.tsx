"use client";
import React from "react";

export default function PurchaseOrdersPage(): JSX.Element {
  const [query, setQuery] = React.useState("");

  return (
    <main className="panel">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h1 style={{ margin:0 }}>أوامر الشراء (POs)</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" disabled>إنشاء PO</button>
        </div>
      </div>

      <div className="toolbar" style={{ justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search"><input className="input" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="بحث بالرقم/المورد/الحالة" /></div>
          <button className="btn btn-outline" disabled>تطبيق</button>
        </div>
      </div>

      <div style={{ padding:12, background:'var(--bg2)', border:'1px solid var(--divider)', borderRadius:8 }}>
        <div style={{ marginBottom:8, color:'var(--sub)' }}>قريباً</div>
        <div>ستُعرض هنا أوامر الشراء، مع إمكان إنشاء وتتبع وتسوية المدفوعات للموردين.</div>
      </div>
    </main>
  );
}

