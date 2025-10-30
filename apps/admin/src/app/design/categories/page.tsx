"use client";
import React from "react";
import { resolveApiBase } from "../../lib/apiBase";

export default function CategoriesManagerPage(): JSX.Element {
  const [rows, setRows] = React.useState<Array<{ site:'mweb'|'web'; hasDraft:boolean; hasLive:boolean; draftUpdatedAt?:string|null; liveUpdatedAt?:string|null }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');
  const [site, setSite] = React.useState<'mweb'|'web'>('mweb');
  const [tabs, setTabs] = React.useState<Array<{ key:string; label:string; sidebarCount:number; gridMode:string }>>([]);
  const [busy, setBusy] = React.useState(false);

  async function load(){
    setLoading(true); setMsg('');
    try{ const j = await (await fetch(`${resolveApiBase()}/api/admin/categories/page/summary`, { credentials:'include' })).json(); setRows(j.items||[]); }
    catch(e:any){ setMsg(e?.message||'failed'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); },[]);

  const loadTabs = React.useCallback(async(s:'mweb'|'web')=>{
    try{
      const j = await (await fetch(`/api/admin/categories/page?site=${s}&mode=draft`, { credentials:'include' })).json();
      const cfg = (j?.config||{}) as any;
      const list = Array.isArray(cfg.tabs)? cfg.tabs : [];
      setTabs(list.map((t:any)=> ({ key: String(t.key||''), label: String(t.label||''), sidebarCount: Array.isArray(t.sidebarItems)? t.sidebarItems.length : 0, gridMode: String(t.grid?.mode||'explicit') })));
    }catch{ setTabs([]); }
  },[]);
  React.useEffect(()=>{ loadTabs(site); },[site, loadTabs]);

  async function publish(site:'mweb'|'web'){
    try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page/publish`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); await load(); }
    catch(e:any){ setMsg(e?.message||'فشل النشر'); }
    finally{ setTimeout(()=> setMsg(''), 1400); }
  }

  function toDate(s?:string|null){ return s? new Date(s).toLocaleString() : '—'; }

  return (
    <div className="container centered">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h1 className="h1">مدير صفحة الفئات</h1>
            <div className="muted">إدارة إعدادات صفحة الفئات لكل موقع مع الوصول إلى المصمم</div>
          </div>
          <div className="actions" style={{display:'flex', gap:8}}>
            <button className="btn btn-outline" onClick={load}>تحديث</button>
            <button className="btn btn-outline" onClick={async ()=>{ try{ const r = await fetch(`${resolveApiBase()}/api/admin/categories/page/import-default`, { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site:'mweb' }) }); if (!r.ok) throw new Error('failed'); await load(); }catch{ alert('فشل الاستيراد'); } }}>استيراد القالب الحالي (mweb)</button>
          </div>
        </div>
        {msg && (<div className={`toast ${/فشل/.test(msg)? 'err':'ok'}`}>{msg}</div>)}
      </div>

      <div className="panel">
        {loading? (<div className="skeleton-table-row" />) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Site</th><th>Draft Updated</th><th>Live Updated</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.site}>
                    <td>{r.site}</td>
                    <td>{toDate(r.draftUpdatedAt)}</td>
                    <td>{toDate(r.liveUpdatedAt)}</td>
                    <td>
                      <span className="badge" style={{height:24, marginInlineEnd:6}}>{r.hasDraft? 'DRAFT ✓' : 'DRAFT —'}</span>
                      <span className="badge" style={{height:24}}>{r.hasLive? 'LIVE ✓' : 'LIVE —'}</span>
                    </td>
                    <td>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                        <a className="btn btn-outline btn-sm" href={`/design/categories/edit?site=${r.site}`}>تحرير</a>
                        <button className="btn btn-outline btn-sm" onClick={()=> publish(r.site)}>نشر</button>
                        <a className="btn btn-outline btn-sm" target="_blank" href={`https://${r.site==='mweb'?'m.jeeey.com':'jeeey.com'}/categories`}>فتح الصفحة</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="toolbar">
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{fontWeight:800}}>تبويبات الموقع</div>
            <select className="select" value={site} onChange={e=> setSite((e.target as HTMLSelectElement).value as any)}>
              <option value="mweb">mweb</option>
              <option value="web">web</option>
            </select>
          </div>
          <div className="actions" style={{display:'flex', gap:8}}>
            <button disabled={busy} className="btn btn-outline btn-sm" onClick={()=> loadTabs(site)}>تحديث</button>
            <button disabled={busy} className="btn btn-sm" onClick={async()=>{
              try{
                setBusy(true);
                const j = await (await fetch(`/api/admin/categories/page?site=${site}&mode=draft`, { credentials:'include' })).json();
                const cfg = (j?.config||{}) as any; const t = Array.isArray(cfg.tabs)? cfg.tabs : [];
                const idx = t.length+1; const newTab = { key:`tab${idx}`, label:`تبويب ${idx}`, grid:{ mode:'explicit', categories: [] }, sidebarItems: [] } as any;
                const next = { ...(cfg||{}), tabs: [...t, newTab] };
                const r = await fetch('/api/admin/categories/page', { method:'PUT', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site, mode:'draft', config: next }) });
                if (!r.ok) throw new Error('failed');
                await loadTabs(site);
              }catch{ alert('تعذر إضافة تبويب'); }
              finally{ setBusy(false); }
            }}>+ تبويب جديد</button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>#</th><th>المفتاح</th><th>التسمية</th><th>عناصر الشريط</th><th>الشبكة</th><th>إجراءات</th></tr>
            </thead>
            <tbody>
              {tabs.map((t, i)=> (
                <tr key={`tab-${i}`}>
                  <td>{i+1}</td>
                  <td dir="ltr">{t.key}</td>
                  <td>{t.label}</td>
                  <td>{t.sidebarCount}</td>
                  <td>{t.gridMode}</td>
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <a className="btn btn-outline btn-sm" href={`/design/categories/edit?site=${site}&tab=${encodeURIComponent(t.key)}`}>تحرير</a>
                    </div>
                  </td>
                </tr>
              ))}
              {!tabs.length && (<tr><td colSpan={6}><div className="muted">— لا توجد تبويبات</div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
