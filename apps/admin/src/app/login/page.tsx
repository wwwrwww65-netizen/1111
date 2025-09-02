"use client";
import React from "react";

export default function AdminLogin(): JSX.Element {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [twofa, setTwofa] = React.useState("");
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
        body: JSON.stringify({ email, password, remember, twoFactorCode: twofa })
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
        <label style={{ display:'grid', gap:6, marginBottom:10 }}>رمز 2FA (إن وُجد)
          <input value={twofa} onChange={(e)=>setTwofa(e.target.value)} placeholder="123456" style={{ padding:10, borderRadius:8, background:'#0b0e14', border:'1px solid #1c2333', color:'#e2e8f0' }} />
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} /> تذكّرني (30 يومًا)
        </label>
        {error && <div style={{ marginBottom:10, color:'#f87171' }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width:'100%', padding:'10px 12px', background:'#800020', color:'#fff', borderRadius:8 }}>{busy? 'جارٍ الدخول...' : 'دخول'}</button>
      </form>
    </main>
  );
}

"use client";
import { useState } from "react";
import { trpc } from "../providers";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.auth.login.useMutation();
  const [redirect, setRedirect] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || '/products';
    } catch { return '/products'; }
  });

  return (
    <main style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h1>تسجيل الدخول (إدارة)</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" type="password" />
        <button
          onClick={async () => {
            try {
              await login.mutateAsync({ email, password });
              window.location.href = redirect || "/products";
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          دخول
        </button>
      </div>
    </main>
  );
}