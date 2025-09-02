"use client";
import React from "react";

export default function AdminLogin(): JSX.Element {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const apiBase = React.useMemo(()=>{
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')) return 'https://jeeeyai.onrender.com';
    return 'http://localhost:4000';
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setBusy(true);
      const res = await fetch(`${apiBase}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'content-type':'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember })
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({error:'login_failed'}));
        setError(j.error || 'فشل تسجيل الدخول');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('next') || '/';
      window.location.href = redirectTo;
    } catch {
      setError('خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'100vh', background:'#0b0e14', padding:24 }}>
      <form onSubmit={onSubmit} style={{ width:360, background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16, color:'#e2e8f0' }}>
        <h1 style={{ margin:0, marginBottom:12, fontSize:20 }}>تسجيل دخول الإدارة</h1>
        <label style={{ display:'grid', gap:6, marginBottom:10 }}>البريد الإلكتروني
          <input value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </label>
        <label style={{ display:'grid', gap:6, marginBottom:10 }}>كلمة المرور
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} /> تذكّرني
        </label>
        {error && <div style={{ marginBottom:10, color:'#f87171' }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width:'100%', padding:'10px 12px', background:'#800020', color:'#fff', borderRadius:8 }}>{busy? 'جارٍ الدخول...' : 'دخول'}</button>
      </form>
    </main>
  );
}