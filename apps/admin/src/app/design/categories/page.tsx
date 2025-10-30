"use client";
import React from "react";

export default function CategoriesManagerPage(): JSX.Element {
  const [rows, setRows] = React.useState<Array<{ site:'mweb'|'web'; hasDraft:boolean; hasLive:boolean; draftUpdatedAt?:string|null; liveUpdatedAt?:string|null }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState('');

  async function load(){
    setLoading(true); setMsg('');
    try{ const j = await (await fetch('/api/admin/categories/page/summary', { credentials:'include' })).json(); setRows(j.items||[]); }
    catch(e:any){ setMsg(e?.message||'failed'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); },[]);

  async function publish(site:'mweb'|'web'){
    try{ const r = await fetch('/api/admin/categories/page/publish', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ site }) }); if (!r.ok) throw new Error('فشل النشر'); setMsg('تم النشر'); await load(); }
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
          <div className="actions">
            <button className="btn btn-outline" onClick={load}>تحديث</button>
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
    </div>
  );
}
