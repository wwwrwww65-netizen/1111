"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function TwoFAPage(): JSX.Element {
  const [otpauth, setOtpauth] = React.useState<string>("");
  const [code, setCode] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  async function enable(){ setStatus(''); const j = await (await fetch(`${apiBase}/api/admin/2fa/enable`,{method:'POST', credentials:'include'})).json(); setOtpauth(j.otpauth); setBackupCodes(Array.isArray(j.backupCodes)? j.backupCodes: []); }
  async function verify(){ setStatus(''); const r= await fetch(`${apiBase}/api/admin/2fa/verify`,{method:'POST',headers:{'content-type':'application/json'}, credentials:'include', body:JSON.stringify({code})}); if(r.ok){ setStatus('تم التفعيل بنجاح'); } else { setStatus('فشل التفعيل'); } }
  async function disable(){ setStatus(''); const r= await fetch(`${apiBase}/api/admin/2fa/disable`,{method:'POST', credentials:'include'}); setStatus(r.ok? 'تم التعطيل':'فشل التعطيل'); }
  return (
    <main>
      <h1 style={{ marginBottom: 16 }}>التحقق بخطوتين (2FA)</h1>
      {status && <div style={{ marginBottom:8, color: status.includes('فشل')? '#ef4444':'#22c55e' }}>{status}</div>}
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
          {backupCodes.length>0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ color:'#94a3b8', marginBottom:6 }}>احتفظ بنسخة من رموز الاستعادة:</div>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6 }}>
                {backupCodes.map((c, i)=> (<li key={i} style={{ padding:'6px 10px', background:'#0b0e14', border:'1px solid #1c2333', borderRadius:8 }}><code>{c}</code></li>))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

