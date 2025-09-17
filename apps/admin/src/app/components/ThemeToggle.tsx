"use client";
import React from 'react';

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = React.useState<'light'|'dark'>(() => {
    if (typeof document === 'undefined') return 'dark';
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved as 'light'|'dark';
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return prefers;
  });
  React.useEffect(()=>{
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
    }
    localStorage.setItem('theme', theme);
  },[theme]);
  return (
    <button className="icon-btn" onClick={()=> setTheme(t=> t==='light'?'dark':'light')} aria-label="Toggle theme">
      {theme === 'light' ? '🌞' : '🌙'}
    </button>
  );
}

