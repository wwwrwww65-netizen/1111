"use client";
import React from "react";

export default function TwoFAPage(): JSX.Element {
  const [otpauth, setOtpauth] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  async function enable(){ const j = await (await fetch('/api/admin/2fa/enable',{method:'POST'})).json(); setOtpauth(j.otpauth); }
  async function verify(){ await fetch('/api/admin/2fa/verify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})}); alert('تم التفعيل'); }
  async function disable(){ await fetch('/api/admin/2fa/disable',{method:'POST'}); alert('تم التعطيل'); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>التحقق بخطوتين (2FA)</h1>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={enable} style={{ padding:'8px 12px', background:'#111827', color:'#e5e7eb', borderRadius:8 }}>توليد مفتاح</button>
        <button onClick={disable} style={{ padding:'8px 12px', background:'#7c2d12', color:'#fff', borderRadius:8 }}>تعطيل</button>
      </div>
      {otpauth && (
        <div style={{ padding:12, border:'1px solid #1c2333', borderRadius:8 }}>
          <div style={{ marginBottom:8 }}>انسخ هذا الرابط لتطبيق المصادقة:</div>
          <code style={{ fontSize:12 }}>{otpauth}</code>
          <div style={{ marginTop:12, display:'flex', gap:8 }}>
            <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="رمز 2FA" style={{ padding:8, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
            <button onClick={verify} style={{ padding:'8px 12px', background:'#064e3b', color:'#e5e7eb', borderRadius:8 }}>تحقق</button>
          </div>
        </div>
      )}
    </main>
  );
}

