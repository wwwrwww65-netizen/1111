"use client";
import React from "react";
import { useParams } from "next/navigation";

export default function EditCampaignPage(): JSX.Element {
  const params = useParams() as { id?: string };
  const id = String(params?.id || "");

  return (
    <main>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom: 16 }}>
        <h1 style={{ margin:0 }}>تعديل حملة</h1>
        <a className="btn btn-outline" href="/promotions/campaigns">رجوع للقائمة</a>
      </div>
      <div style={{ background:'var(--panel,#fff)', color:'var(--fg,#111)', borderRadius:12, border:'1px solid #e5e7eb', overflow:'hidden' }}>
        <iframe
          title="campaign-wizard"
          src={`/promotions/campaigns?mode=wizard&id=${encodeURIComponent(id)}`}
          style={{ width:'100%', height:'calc(100vh - 160px)', border:0, background:'transparent' }}
        />
      </div>
    </main>
  );
}


