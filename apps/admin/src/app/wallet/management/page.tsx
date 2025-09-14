"use client";
import React from "react";

export default function WalletPlaceholder(): JSX.Element {
  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'calc(100vh - 60px)', background:'transparent', padding:24 }}>
      <div style={{ background:'#101826', border:'1px solid #1f2a3a', borderRadius:12, padding:24, color:'#e2e8f0', maxWidth:560, textAlign:'center' }}>
        <h1 style={{ margin:0, marginBottom:8, fontSize:20 }}>الصفحة قيد التنفيذ</h1>
        <p style={{ margin:0, color:'#a3b2c7' }}>محفظة العملاء ستُفعّل قريبًا.</p>
      </div>
    </main>
  );
}

