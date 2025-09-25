"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

type Node = { id:string; name:string; parentId?:string|null; children?:Node[] };

export function CategoriesTree(): JSX.Element {
  const [tree, setTree] = React.useState<Node[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [parentId, setParentId] = React.useState<string>('');

  const load = React.useCallback(async()=>{
    setLoading(true); setErr(null);
    try{
      const j = await (await fetch(`${resolveApiBase()}/api/admin/categories/tree`, { headers:{ 'accept':'application/json' } })).json();
      setTree(j.tree||[]);
    }catch{ setErr('تعذر الجلب'); }
    finally{ setLoading(false); }
  },[]);

  React.useEffect(()=>{ load(); }, [load]);

  async function add(){
    if(!name.trim()) return;
    const r = await fetch(`${resolveApiBase()}/api/admin/categories`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ name, parentId: parentId||undefined }) });
    if (r.ok){ setName(''); setParentId(''); await load(); }
  }

  function render(nodes: Node[]): JSX.Element {
    return (
      <ul style={{ listStyle:'none', paddingInlineStart:12, display:'grid', gap:6 }}>
        {nodes.map(n=> (
          <li key={n.id}>
            <div className="panel" style={{ padding:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>{n.name}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn btn-sm btn-outline" onClick={async()=>{ await fetch(`${resolveApiBase()}/api/admin/categories/${n.id}`, { method:'PATCH', headers:{'content-type':'application/json'}, body: JSON.stringify({ name: prompt('اسم جديد', n.name)||n.name }) }); await load(); }}>تعديل</button>
                <button className="btn btn-sm danger" onClick={async()=>{ const ok=confirm('حذف؟'); if(!ok) return; await fetch(`${resolveApiBase()}/api/admin/categories/${n.id}`, { method:'DELETE' }); await load(); }}>حذف</button>
              </div>
            </div>
            {n.children && n.children.length>0 && render(n.children)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="panel">
      <div style={{ fontWeight:800, marginBottom:8 }}>شجرة الفئات</div>
      {loading && <div>جارٍ التحميل…</div>}
      {err && <div style={{ color:'var(--err)' }}>{err}</div>}
      {!loading && !err && render(tree)}
      <div style={{ marginTop:12, display:'grid', gap:8 }}>
        <div style={{ fontWeight:700 }}>إضافة فئة</div>
        <input className="input" placeholder="اسم الفئة" value={name} onChange={e=> setName(e.target.value)} />
        <input className="input" placeholder="ParentId (اختياري)" value={parentId} onChange={e=> setParentId(e.target.value)} />
        <button className="btn" onClick={add}>إضافة</button>
      </div>
    </div>
  );
}

