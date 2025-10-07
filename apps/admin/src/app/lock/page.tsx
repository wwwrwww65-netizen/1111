"use client";
import React from "react";
import { resolveApiBase } from "../lib/apiBase";

export default function LockScreen(): JSX.Element {
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [busy, setBusy] = React.useState<boolean>(false);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);

  React.useEffect(()=>{
    try{
      const raw = localStorage.getItem("admin_locked_email");
      if (raw) setEmail(raw);
    }catch{}
  },[]);

  async function unlock(e: React.FormEvent){
    e.preventDefault(); setError(""); setBusy(true);
    try{
      const target = typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api/admin/auth/login` : `${apiBase}/api/admin/auth/login`;
      const res = await fetch(target, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ email, password, remember: true }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        setError(j?.error || 'فشل فتح القفل');
        return;
      }
      try{ localStorage.removeItem('admin_locked'); localStorage.removeItem('admin_locked_email'); }catch{}
      window.location.assign('/');
    }catch{
      setError('خطأ غير متوقع');
    } finally { setBusy(false); }
  }

  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'100vh', background:'#0b0e14', padding:24 }}>
      <form onSubmit={unlock} style={{ width:360, background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16, color:'#e2e8f0' }}>
        <h1 style={{ margin:0, marginBottom:12, fontSize:20 }}>القفل مؤقتًا</h1>
        <p style={{ color:'#94a3b8', fontSize:12, marginTop:0, marginBottom:12 }}>لحماية الحساب تم قفل اللوحة. أدخل كلمة المرور لإلغاء القفل.</p>
        <label style={{ display:'grid', gap:6, marginBottom:10 }}>البريد الإلكتروني
          <input value={email} onChange={(e)=>{ setEmail(e.target.value); try{ localStorage.setItem('admin_locked_email', e.target.value); }catch{} }} required style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </label>
        <label style={{ display:'grid', gap:6, marginBottom:10 }}>كلمة المرور
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </label>
        {error && <div style={{ marginBottom:10, color:'#f87171' }}>{error}</div>}
        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" disabled={busy} style={{ flex:1, padding:'10px 12px', background:'#800020', color:'#fff', borderRadius:8 }}>{busy? 'جارٍ الفتح...' : 'فتح'}</button>
          <a href="/login" className="btn btn-outline" style={{ textAlign:'center', padding:'10px 12px', borderRadius:8 }}>تبديل مستخدم</a>
        </div>
      </form>
    </main>
  );
}
