"use client";
import React from "react";
import { resolveApiBase } from "../../../lib/apiBase";

export default function NewCampaignPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [ready, setReady] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  React.useEffect(()=>{ setReady(true); },[]);

  if (!ready) return (<main><div style={{ padding:16 }}>تحميل...</div></main>);

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>إنشاء حملة ترويجية</h1>
        <a className="btn btn-outline" href="/promotions/campaigns">رجوع للقائمة</a>
      </div>
      <div style={{ background:'var(--panel,#fff)', color:'var(--fg,#111)', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <iframe
          title="campaign-wizard"
          src="/promotions/campaigns?mode=wizard&create=1"
          style={{ width:'100%', height:'calc(100vh - 160px)', border:0, background:'transparent' }}
        />
      </div>
      {msg && (<div className="toast" style={{ marginTop:12 }}>{msg}</div>)}
    </main>
  );
}



