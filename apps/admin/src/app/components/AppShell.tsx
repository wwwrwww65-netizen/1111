"use client";
import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu } from "./AccountMenu";
import { CommandPalette } from './CommandPalette';
import { LanguageToggle } from './LanguageToggle';

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  if (pathname === '/login' || pathname.startsWith('/(auth)') || pathname.startsWith('/mobile')) {
    return <>{children}</>;
  }
  const [open, setOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState<boolean>(true);
  const [openCmd, setOpenCmd] = React.useState(false);
  const [forceDesktop, setForceDesktop] = React.useState<boolean>(()=>{
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('admin_force_desktop') === '1'; } catch { return false; }
  });
  const [isDesktop, setIsDesktop] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true; // default SSR: desktop to avoid overlay
    try { return window.matchMedia('(min-width: 980px)').matches; } catch { return true; }
  });
  React.useEffect(()=>{
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onEsc);
    const mq = window.matchMedia('(min-width: 980px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => {
      document.removeEventListener('keydown', onEsc);
      mq.removeEventListener?.('change', apply);
    };
  },[]);
  React.useEffect(()=>{ try { localStorage.setItem('admin_force_desktop', forceDesktop ? '1' : ''); } catch {} }, [forceDesktop]);
  // Redirect to lock screen if locked
  React.useEffect(()=>{
    try {
      if (typeof window === 'undefined') return;
      const locked = localStorage.getItem('admin_locked') === '1';
      const isLock = pathname === '/lock';
      if (locked && !isLock) {
        window.location.href = '/lock';
      }
    } catch {}
  }, [pathname]);
  React.useEffect(()=>{
    const onKey = (e: KeyboardEvent)=>{
      const mod = e.ctrlKey || (e.metaKey && navigator.platform.toLowerCase().includes('mac'));
      if (mod && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setOpenCmd(true); }
      if (e.key === 'Escape') setOpenCmd(false);
    };
    document.addEventListener('keydown', onKey);
    return ()=> document.removeEventListener('keydown', onKey);
  },[]);
  return (
    <div className={`app-root ${forceDesktop ? 'force-desktop' : ''}`}>
      <CommandPalette open={openCmd} onClose={()=> setOpenCmd(false)} />
      <header className="topbar">
        <div className="brand-wrap" style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
          <button className="icon-btn menu-toggle" aria-label="Toggle menu" onClick={()=> { if (!(isDesktop || forceDesktop)) setOpen(o=>!o); else setDesktopOpen(v=>!v); }}>
            ☰
          </button>
          <div className="brand" style={{marginInlineStart:12,fontWeight:800}}>جي jeeey</div>
        </div>
        <div className="search"><form action="/search" method="GET" onSubmit={(e)=>{ e.preventDefault(); const form=e.currentTarget; const q=(form.querySelector('input[name="q"]') as HTMLInputElement)?.value?.trim(); if (!q) return; window.location.assign(`/search?q=${encodeURIComponent(q)}`); }}><input name="q" className="input" placeholder="بحث سريع…" /></form></div>
        <div className="top-actions">
          <button className="icon-btn" title="Command Palette (Ctrl+K)" onClick={()=> setOpenCmd(true)}>⌘</button>
          <button className="icon-btn" aria-pressed={forceDesktop} title="عرض سطح المكتب" onClick={()=> setForceDesktop(v=> !v)}>
            سطح المكتب
          </button>
          <ThemeToggle />
          <LanguageToggle />
          <AccountMenu />
        </div>
      </header>
      <div className="shell" style={{ direction: 'ltr' }}>
        <main className="content container">
          {children}
        </main>
        {/* Desktop static sidebar */}
        <aside className={`sidebar desktop ${(isDesktop || forceDesktop) && desktopOpen ? 'open' : 'collapsed'}`} style={{ display: (isDesktop || forceDesktop) ? 'block' : 'none' }}>
          <Sidebar />
        </aside>
        {/* Mobile drawer sidebar */}
        {!(isDesktop || forceDesktop) && (
          <>
            <aside className={`sidebar drawer ${open ? 'is-open' : ''}`} aria-hidden={!open} role="dialog" aria-modal="true">
              <Sidebar />
            </aside>
            <div className="overlay" style={{display: open ? 'block' : 'none'}} onClick={()=> setOpen(false)} aria-hidden={!open} />
          </>
        )}
      </div>
    </div>
  );
}

