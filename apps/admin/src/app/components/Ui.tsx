"use client";
import React from 'react';

export function Section({ title, subtitle, toolbar, children }:{ title:string; subtitle?:string; toolbar?:React.ReactNode; children:React.ReactNode }): JSX.Element {
  return (
    <section className="panel" style={{ marginBottom:16, padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:16 }}>{title}</h2>
          {subtitle && <div style={{ color:'var(--sub)', fontSize:12, marginTop:4 }}>{subtitle}</div>}
        </div>
        {toolbar && <div className="toolbar" style={{ gap:8 }}>{toolbar}</div>}
      </div>
      <div style={{ display:'grid', gap:12 }}>{children}</div>
    </section>
  );
}

export function Tabs({ value, onChange, items }:{ value:string; onChange:(v:string)=>void; items:Array<{key:string; label:string}> }): JSX.Element {
  return (
    <div className="btn-group" style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12 }}>
      {items.map(it=> (
        <button key={it.key} onClick={()=> onChange(it.key)} className={`btn btn-sm ${value===it.key? '':'btn-outline'}`}>{it.label}</button>
      ))}
    </div>
  );
}

export function Toolbar({ left, right }:{ left?:React.ReactNode; right?:React.ReactNode }): JSX.Element {
  return (
    <div className="toolbar" style={{ justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>{left}</div>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>{right}</div>
    </div>
  );
}

export function StickyTableHeader(): JSX.Element {
  return <thead style={{ position:'sticky', top:0, background:'var(--panel)', zIndex:1 }} /> as any;
}

