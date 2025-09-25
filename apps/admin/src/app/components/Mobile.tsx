"use client";
import React from 'react';

export function useIsMobile(breakpointPx: number = 992): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return window.matchMedia(`(max-width: ${breakpointPx - 1}px)`).matches; } catch { return false; }
  });
  React.useEffect(()=>{
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return ()=> mq.removeEventListener?.('change', apply);
  }, [breakpointPx]);
  return isMobile;
}

type ColumnDef<T> = { key: keyof T | string; title: string; minWidth?: number };

export function ResponsiveTable<T>({
  items,
  columns,
  renderCard,
  renderRow,
  isLoading,
  emptyText = 'لا توجد بيانات'
}: {
  items: T[];
  columns: ColumnDef<T>[];
  renderCard: (item: T) => React.ReactNode;
  renderRow?: (item: T) => React.ReactNode;
  isLoading?: boolean;
  emptyText?: string;
}): JSX.Element {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <div className="card-list">
        {isLoading && <div className="panel" style={{ padding:12 }}>جارٍ التحميل…</div>}
        {!isLoading && items.length === 0 && (
          <div className="panel" style={{ padding:12, color:'var(--sub)' }}>{emptyText}</div>
        )}
        {!isLoading && items.map((it, idx)=> (
          <div key={(it as any).id || idx} className="card">
            {renderCard(it)}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ overflowX:'auto' }}>
      <table className="table">
        <thead>
          <tr>{columns.map(c=> (<th key={String(c.key)} style={{minWidth:c.minWidth||120}}>{c.title}</th>))}</tr>
        </thead>
        <tbody>
          {isLoading && (<tr><td colSpan={columns.length} style={{ padding:12 }}>جارٍ التحميل…</td></tr>)}
          {!isLoading && items.length===0 && (<tr><td colSpan={columns.length} style={{ padding:12, color:'var(--sub)' }}>{emptyText}</td></tr>)}
          {!isLoading && items.map((it, idx)=> (
            <tr key={(it as any).id || idx}>
              {renderRow ? renderRow(it) : columns.map(c=> (<td key={String(c.key)}>{(it as any)[c.key as any]}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FilterBar({
  value,
  onChange,
  right,
  children
}:{
  value: string;
  onChange: (v:string)=>void;
  right?: React.ReactNode;
  children?: React.ReactNode;
}): JSX.Element {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  return (
    <div className="toolbar">
      <div className="search"><input className="input" value={value} onChange={(e)=> onChange(e.target.value)} placeholder="بحث" /></div>
      {isMobile ? (
        <>
          <button className="btn btn-outline" onClick={()=> setOpen(true)}>فلاتر</button>
          {right}
          {open && (
            <div className="modal" role="dialog" aria-modal="true">
              <div className="dialog">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <h3 className="title">فلاتر</h3>
                  <button className="icon-btn" onClick={()=> setOpen(false)}>إغلاق</button>
                </div>
                <div className="grid" style={{ gap:12 }}>{children}</div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                  <button className="btn" onClick={()=> setOpen(false)}>تطبيق</button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>{children}{right}</div>
      )}
    </div>
  );
}

export function FormGrid({ children }:{ children:React.ReactNode }): JSX.Element {
  const isMobile = useIsMobile();
  const cols = isMobile ? '1fr' : '1fr 1fr';
  return <div className="grid" style={{ gridTemplateColumns: cols, gap:12 }}>{children}</div> as any;
}

export function ActionBarMobile({ children }:{ children:React.ReactNode }): JSX.Element {
  const isMobile = useIsMobile();
  if (!isMobile) return <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>{children}</div> as any;
  return (
    <div style={{ position:'sticky', bottom:0, background:'var(--panel)', borderTop:'1px solid var(--muted)', padding:12, display:'flex', gap:8, justifyContent:'space-between', zIndex:10 }}>
      {children}
    </div>
  );
}

export function BackButton(): JSX.Element {
  return <button className="icon-btn" onClick={()=>{ if (history.length>1) history.back(); }} aria-label="رجوع">رجوع</button>;
}

