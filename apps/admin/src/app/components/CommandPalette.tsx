"use client";
import React from 'react';
import { usePathname } from 'next/navigation';

type Cmd = { id: string; title: string; href?: string; action?: () => void; group?: string };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  const pathname = usePathname();
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement|null>(null);

  const commands = React.useMemo<Cmd[]>(() => [
    { id:'home', title:'الرئيسية', href:'/' , group:'التنقل' },
    { id:'analytics', title:'التحليلات', href:'/analytics' , group:'التنقل' },
    { id:'users', title:'المستخدمون', href:'/users' , group:'التنقل' },
    { id:'vendors', title:'الموردون', href:'/vendors' , group:'التنقل' },
    { id:'orders', title:'الطلبات', href:'/orders' , group:'التنقل' },
    { id:'drivers', title:'السائقون', href:'/drivers' , group:'التنقل' },
    { id:'pickup', title:'من المورد إلى المستودع', href:'/logistics/pickup' , group:'التنقل' },
    { id:'warehouse', title:'المعالجة في المستودع', href:'/logistics/warehouse' , group:'التنقل' },
    { id:'delivery', title:'التوصيل إلى العميل', href:'/logistics/delivery' , group:'التنقل' },
    { id:'finance', title:'المالية/المصروفات', href:'/finance/expenses' , group:'التنقل' },
    { id:'pnl', title:'المالية/تحليل الأرباح', href:'/finance/pnl' , group:'التنقل' },
    { id:'rbac', title:'الأدوار والصلاحيات', href:'/settings/rbac' , group:'التنقل' },
    { id:'categories', title:'التصنيفات', href:'/categories' , group:'التنقل' },
  ], []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => c.title.toLowerCase().includes(q) || (c.href||'').toLowerCase().includes(q));
  }, [commands, query]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal onClick={onClose}>
      <div className="dialog" onClick={(e)=> e.stopPropagation()} style={{ width: 560, maxWidth:'90vw' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <input ref={inputRef} value={query} onChange={e=> setQuery(e.target.value)} placeholder="ابحث أو انتقل..." className="input" />
          <button className="btn ghost" onClick={onClose}>إغلاق</button>
        </div>
        <div style={{ maxHeight: 360, overflow:'auto', border:'1px solid var(--muted)', borderRadius:8 }}>
          {filtered.map((c) => (
            <div key={c.id}
              onClick={() => { if (c.href) window.location.assign(c.href); else c.action?.(); onClose(); }}
              style={{ padding:'10px 12px', cursor:'pointer', background: pathname===c.href ? '#0a0e17' : 'transparent', borderBottom:'1px solid var(--muted)' }}
            >
              <div style={{ fontWeight:600 }}>{c.title}</div>
              <div style={{ color:'var(--sub)', fontSize:12 }}>{c.href || ''}</div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ padding:12, color:'var(--sub)' }}>لا نتائج</div>
          )}
        </div>
        <div style={{ marginTop:8, color:'var(--sub)', fontSize:12 }}>تلميح: اضغط Ctrl+K لفتح اللوحة</div>
      </div>
    </div>
  );
}

