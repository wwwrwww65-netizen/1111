"use client";
import React from 'react';
import { resolveApiBase } from "../lib/apiBase";

export function AccountMenu(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [user, setUser] = React.useState<{ name?:string; email?:string; avatarUrl?:string }|null>(null);
  React.useEffect(()=>{
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.account-menu')) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  },[]);
  React.useEffect(()=>{
    (async()=>{
      try{ const j = await (await fetch(`${apiBase}/api/admin/auth/whoami`, { credentials:'include' })).json(); setUser(j?.user||null); }catch{ setUser(null); }
    })();
  },[apiBase]);
  async function logout(){
    try { await fetch(`${apiBase}/api/admin/auth/logout`, { method:'POST', credentials:'include' }); } catch {}
    window.location.href = '/login';
  }
  async function lockNow(){
    try {
      localStorage.setItem('admin_locked','1');
      if (user?.email) localStorage.setItem('admin_locked_email', user.email);
    } catch {}
    window.location.href = '/lock';
  }
  return (
    <div className="account-menu" style={{ position:'relative' }}>
      <button className="icon-btn" onClick={()=> setOpen(o=>!o)} aria-haspopup="menu" aria-expanded={open}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name||user.email||'حسابي'} style={{ width:32, height:32, borderRadius:'999px', objectFit:'cover' }} />
        ) : (
          <span style={{display:'inline-flex',width:32,height:32,borderRadius:'999px',background:'#334155',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{(user?.name||user?.email||'J').slice(0,1).toUpperCase()}</span>
        )}
      </button>
      {open && (
        <div role="menu" className="dropdown" style={{ position:'absolute', insetInlineEnd:0, marginTop:8, minWidth:200, background:'#0f1420', border:'1px solid #1c2333', borderRadius:10, padding:8, zIndex:80 }}>
          <a className="nav-item" href="/settings" role="menuitem" style={{display:'block'}}>الإعدادات</a>
          <a className="nav-item" href="/users" role="menuitem" style={{display:'block'}}>الملف الشخصي</a>
          <button className="nav-item" onClick={lockNow} role="menuitem" style={{width:'100%',textAlign:'start'}}>قفل مؤقت</button>
          <button className="nav-item" onClick={logout} role="menuitem" style={{width:'100%',textAlign:'start'}}>تسجيل الخروج</button>
        </div>
      )}
    </div>
  );
}

