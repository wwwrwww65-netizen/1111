"use client";
import React from 'react';
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { AccountMenu } from "./AccountMenu";

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  React.useEffect(()=>{
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  },[]);
  return (
    <div className="app-root">
      <header className="topbar" style={{background:'linear-gradient(90deg,#0f1420,#101939)',color:'#e2e8f0',borderBottom:'1px solid #1c2333'}}>
        <button className="icon-btn" aria-label="Toggle menu" onClick={()=> setOpen(o=>!o)}>
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
        <aside className="sidebar desktop">
          <Sidebar />
        </aside>
        {/* Mobile drawer sidebar */}
        <aside className={`sidebar drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
          <Sidebar />
        </aside>
        {open && <div className="overlay" onClick={()=> setOpen(false)} />}
        <main className="content container">
          {children}
        </main>
      </div>
    </div>
  );
}

