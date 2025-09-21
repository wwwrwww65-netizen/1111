"use client";
import React from 'react';

export function LanguageToggle(): JSX.Element {
  const [dir, setDir] = React.useState<'rtl'|'ltr'>(()=> (typeof document!=='undefined' ? (document.documentElement.getAttribute('dir') as any)||'rtl' : 'rtl'));
  const [lang, setLang] = React.useState<'ar'|'en'>(()=> (typeof document!=='undefined' ? (document.documentElement.getAttribute('lang') as any)||'ar' : 'ar'));
  React.useEffect(()=>{
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem('admin_lang', lang); localStorage.setItem('admin_dir', dir); } catch {}
  }, [dir, lang]);
  React.useEffect(()=>{
    try {
      const l = localStorage.getItem('admin_lang') as any; const d = localStorage.getItem('admin_dir') as any;
      if (l==='ar' || l==='en') setLang(l);
      if (d==='rtl' || d==='ltr') setDir(d);
    } catch {}
  },[]);
  return (
    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
      <button className="btn btn-sm" onClick={()=>{ setLang(l=> l==='ar'?'en':'ar'); setDir(d=> d==='rtl'?'ltr':'rtl'); }} title="تبديل اللغة/الاتجاه">
        {lang==='ar' ? 'AR/RTL' : 'EN/LTR'}
      </button>
    </div>
  );
}

