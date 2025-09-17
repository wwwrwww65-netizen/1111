"use client";
import React from 'react';
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu } from "./AccountMenu";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try { return (window.localStorage.getItem('admin_sidebar_open') ?? '1') === '1'; } catch { return true; }
  });
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // default SSR: desktop to avoid overlay
    try { return window.matchMedia('(min-width: 992px)').matches; } catch { return true; }
  });
  React.useEffect(()=>{
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onEsc);
    const mq = window.matchMedia('(min-width: 992px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => {
      document.removeEventListener('keydown', onEsc);
      mq.removeEventListener?.('change', apply);
    };
  },[]);
  React.useEffect(()=>{
    try { window.localStorage.setItem('admin_sidebar_open', desktopOpen ? '1' : '0'); } catch {}
  }, [desktopOpen]);
  return (
    <div className="app-root">
      <header className="topbar" style={{background:'linear-gradient(90deg,#0f1420,#101939)',color:'#e2e8f0',borderBottom:'1px solid #1c2333'}}>
        <button className="icon-btn menu-toggle" aria-label="Toggle menu" onClick={()=> { if (!isDesktop) setOpen(o=>!o); else setDesktopOpen(v=>!v); }}>
          ☰
        </button>
        <div className="brand" style={{marginInlineStart:12,fontWeight:800}}>جي jeeey</div>
        <div className="top-actions" style={{display:'flex',alignItems:'center',gap:12}}>
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>
      <div className="shell">
        {/* Desktop static sidebar */}
        <aside className={`sidebar desktop ${desktopOpen ? '' : 'collapsed'}`}>
          <Sidebar />
        </aside>
        {/* Mobile drawer sidebar */}
        {!isDesktop && (
          <>
            <aside className={`sidebar drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
              <Sidebar />
            </aside>
            {open && <div className="overlay" onClick={()=> setOpen(false)} />}
          </>
        )}
        <main className="content container" style={{ marginRight: isDesktop && desktopOpen ? 260 : 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

