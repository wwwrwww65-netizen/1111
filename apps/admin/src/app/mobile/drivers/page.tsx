"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';
import { FilterBar } from '../../components/Mobile';

type Driver = { id:string; name:string; phone?:string; status?:string };

export default function MobileDrivers(): JSX.Element {
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<'list'|'map'>('list');
  const [live, setLive] = React.useState<Array<{id:string;name:string;lat:number;lng:number;status?:string}>>([]);

  const load = React.useCallback(async ()=>{
    setLoading(true); setError(null);
    try{
      const u = new URL(`${resolveApiBase()}/api/admin/drivers`);
      if (q.trim()) u.searchParams.set('q', q.trim());
      const r = await fetch(u.toString(), { headers:{ 'accept':'application/json' }, credentials:'include' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const j = await r.json();
      setItems(j.drivers||j.items||[]);
    }catch{ setError('تعذر الجلب'); }
    finally{ setLoading(false); }
  }, [q]);

  React.useEffect(()=>{ const t = setTimeout(load, 300); return ()=> clearTimeout(t); }, [load]);
  React.useEffect(()=>{
    if (tab!=='map') return;
    let timer: any;
    const poll = async()=>{
      try{ const j = await (await fetch(`${resolveApiBase()}/api/admin/logistics/drivers/locations`, { credentials:'include' })).json(); setLive(j||j.drivers||[]); }catch{}
      timer = setTimeout(poll, 5000);
    };
    poll();
    return ()=> timer && clearTimeout(timer);
  }, [tab]);

  return (
    <div className="grid" style={{ gap:12 }}>
      <div className="panel">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800 }}>السائقون</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className={`btn btn-sm ${tab==='list'?'btn-active':''}`} onClick={()=> setTab('list')}>قائمة</button>
            <button className={`btn btn-sm ${tab==='map'?'btn-active':''}`} onClick={()=> setTab('map')}>خريطة</button>
          </div>
        </div>
        <FilterBar value={q} onChange={setQ} />
      </div>
      <div className="panel">
        <div style={{ fontWeight:700, marginBottom:8 }}>إضافة سائق</div>
        <div className="grid" style={{ gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input className="input" id="dName" placeholder="الاسم" />
          <input className="input" id="dPhone" placeholder="الهاتف" />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button className="btn" onClick={async()=>{
            const name = (document.getElementById('dName') as HTMLInputElement)?.value.trim();
            const phone = (document.getElementById('dPhone') as HTMLInputElement)?.value.trim();
            if(!name) return;
            const r = await fetch(`${resolveApiBase()}/api/admin/drivers`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ name, phone }) });
            if(r.ok){ (document.getElementById('dName') as HTMLInputElement).value=''; (document.getElementById('dPhone') as HTMLInputElement).value=''; await load(); }
          }}>إضافة</button>
        </div>
      </div>
      {tab==='map' && (
        <div className="panel">
          <div style={{ fontSize:12, color:'var(--sub)', marginBottom:8 }}>تحديث كل 5 ثوانٍ</div>
          <div style={{ height:320, background:'#0e1524', border:'1px solid var(--muted)', borderRadius:8, display:'grid', placeItems:'center', color:'var(--sub)' }}>
            خريطة بسيطة (قيد التوسعة) — السائقون: {live.length}
          </div>
        </div>
      )}
      {tab==='list' && loading && <div className="panel">جارٍ التحميل…</div>}
      {tab==='list' && error && <div className="panel" style={{ color:'var(--err)' }}>{error}</div>}
      {tab==='list' && !loading && !error && items.length===0 && <div className="panel" style={{ color:'var(--sub)' }}>لا يوجد سائقون</div>}
      {tab==='list' && !loading && !error && items.map((d)=> (
        <a key={d.id} className="panel" href={`/mobile/drivers/${d.id}`} style={{ textDecoration:'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700 }}>{d.name}</div>
              {d.phone && <div style={{ fontSize:12, color:'var(--sub)' }}>{d.phone}</div>}
            </div>
            {d.status && <span className="badge" style={{ background:'#101828', border:'1px solid #233046', padding:'4px 8px', borderRadius:8 }}>{d.status}</span>}
          </div>
        </a>
      ))}
    </div>
  );
}

