"use client";
export const dynamic = 'force-dynamic';
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function AdminLogin(): JSX.Element {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [toast, setToast] = React.useState<string>("");
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  // If temporarily locked, show a hint to go to lock screen
  const locked = typeof window !== 'undefined' ? (localStorage.getItem('admin_locked') === '1') : false;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setBusy(true);
      // Prefer same-origin proxy if available
      const target = typeof window !== 'undefined' && window.location.origin ? `${window.location.origin}/api/admin/auth/login` : `${apiBase}/api/admin/auth/login`;
      const res = await fetch(target, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember })
      });
      const j = await res.json().catch(()=>null) as any;
      if (!res.ok) {
        let msg = (j && (j.error || j.message)) || 'فشل تسجيل الدخول';
        if (String(j?.error||'').includes('locked')) msg = 'تم حظر الحساب مؤقتًا بسبب محاولات فاشلة. حاول لاحقًا.';
        setError(msg);
        setToast(msg);
        setTimeout(()=> setToast(""), 4000);
        return;
      }
      // Prefer token from response, else try read from cookie, else validate session
      let token: string | undefined = j?.token;
      if (!token && typeof document !== 'undefined') {
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        if (m) { try { token = decodeURIComponent(m[1]); } catch { token = m[1]; } }
      }
      const params = new URLSearchParams(window.location.search);
      const rawNext = params.get('next') || '/';
      // Sanitize next: allow only same-origin targets; fallback to '/'
      let redirectTo = '/';
      try {
        const u = new URL(rawNext, window.location.origin);
        redirectTo = (u.origin === window.location.origin)
          ? (u.pathname + (u.search || '') + (u.hash || ''))
          : '/';
      } catch { redirectTo = '/'; }
      // Set auth cookie via same-origin API, then redirect internally (ignore external next to avoid client rewrites)
      if (token) {
        try {
          await fetch('/api/auth/set', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token, remember })
          });
        } catch {}
        window.location.assign('/');
        return;
      }
      // Fallback to session check
      const sess = await fetch(`${apiBase}/api/admin/auth/sessions`, { credentials:'include', cache:'no-store' });
      if (sess.ok) {
        window.location.assign('/');
      } else {
        const msg = 'فشل تسجيل الدخول';
        setError(msg);
        setToast(msg);
        setTimeout(()=> setToast(""), 4000);
      }
    } catch {
      const msg = 'خطأ غير متوقع';
      setError(msg);
      setToast(msg);
      setTimeout(()=> setToast(""), 4000);
    } finally { setBusy(false); }
  }

  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'100vh', background:'#0b0e14', padding:24, position:'relative' }}>
      <form onSubmit={onSubmit} style={{ width:360, background:'#0f1420', border:'1px solid #1c2333', borderRadius:12, padding:16, color:'#e2e8f0' }}>
        <h1 style={{ margin:0, marginBottom:12, fontSize:20 }}>تسجيل دخول الإدارة</h1>
        {locked && (
          <div style={{ marginBottom:10, color:'#f59e0b', fontSize:12 }}>تم تفعيل القفل المؤقت. يمكنك <a href="/lock" className="link">فتح القفل هنا</a>.</div>
        )}
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
        {process.env.NEXT_PUBLIC_SSO_ISSUER && (
          <a href={`/api/admin/auth/sso/login`} style={{ display:'block', textAlign:'center', marginTop:10, padding:'10px 12px', border:'1px solid #1c2333', borderRadius:8, color:'#e2e8f0', background:'#0b0e14' }}>تسجيل الدخول عبر المؤسسة</a>
        )}
      </form>
      {toast && (
        <div className="toast err" role="status" aria-live="polite" style={{ position:'fixed', right:16, bottom:16, zIndex:9999, background:'#2a0f0f', border:'1px solid #7f1d1d', color:'#fff', padding:'10px 14px', borderRadius:10 }}>
          {toast}
        </div>
      )}
    </main>
  );
}

