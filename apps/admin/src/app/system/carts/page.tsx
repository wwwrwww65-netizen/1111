"use client";
import React from 'react';

type TabKey = 'users' | 'guests';

export default function CartsPage(): JSX.Element {
  const [tab, setTab] = React.useState<TabKey>('users');
  const [since, setSince] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [userCarts, setUserCarts] = React.useState<any[]>([]);
  const [guestCarts, setGuestCarts] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [notifyTitle, setNotifyTitle] = React.useState('');
  const [notifyBody, setNotifyBody] = React.useState('');

  async function load(){
    setLoading(true); setError('');
    try{
      const url = since? `/api/admin/carts?since=${encodeURIComponent(since)}` : '/api/admin/carts';
      const r = await fetch(url, { credentials:'include' });
      const j = await r.json();
      if (r.ok) { setUserCarts(j.userCarts||[]); setGuestCarts(j.guestCarts||[]); } else setError(j.error||'failed');
    }
    catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function shortHash(s: string): string {
    try{
      let h = 2166136261 >>> 0;
      for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return (h>>>0).toString(36).slice(0,6).toUpperCase();
    }catch{ return 'GUEST'; }
  }

  function toggleAll(list:any[]){ const m:Record<string,boolean> = {}; list.forEach((c)=>{ m[c.id] = !Object.values(selected).every(Boolean); }); setSelected(m); }
  function targets(){
    if (tab==='users') return userCarts.filter(c=>selected[c.id]).map(c=> ({ userId: c.user?.id }))
    return guestCarts.filter(c=>selected[c.id]).map(c=> ({ guestSessionId: c.sessionId }))
  }
  async function sendNotify(){
    if (!notifyTitle || !notifyBody) return;
    const t = targets(); if (!t.length) return;
    const r = await fetch('/api/admin/carts/notify', { method:'POST', headers:{'content-type':'application/json'}, credentials:'include', body: JSON.stringify({ targets: t, title: notifyTitle, body: notifyBody }) });
    if (r.ok) { setSelected({}); setNotifyTitle(''); setNotifyBody(''); }
  }

  const rows = tab==='users'? userCarts : guestCarts;

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>سلال التسوق</h1>
          <div className="toolbar" style={{ display:'flex', gap:8 }}>
            <input type="datetime-local" value={since} onChange={(e)=> setSince(e.target.value)} className="input" />
            <button onClick={load} className="btn btn-outline">تصفية</button>
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8 }} role="tablist" aria-label="تبويبات السلال">
          <button role="tab" aria-selected={tab==='users'} onClick={()=> setTab('users')} className={`btn ${tab==='users'?'':'btn-outline'}`}>مستخدمون</button>
          <button role="tab" aria-selected={tab==='guests'} onClick={()=> setTab('guests')} className={`btn ${tab==='guests'?'':'btn-outline'}`}>زوار</button>
        </div>

        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 200 }} /> : error ? <div className="error" aria-live="assertive">فشل: {error}</div> : (
          <div style={{ overflowX:'auto', marginTop:12 }}>
            <table className="table" role="table" aria-label={tab==='users'? 'سلال المستخدمين':'سلال الزوار'}>
              <thead><tr>
                <th><input type="checkbox" onChange={()=> toggleAll(rows)} aria-label="تحديد الكل" /></th>
                <th>{tab==='users'? 'المستخدم' : 'الزائر'}</th>
                <th>اسم الزائر</th>
                <th>المعرف</th>
                <th>المنتجات</th>
                <th>آخر تحديث</th>
              </tr></thead>
              <tbody>
                {rows.map(c=> (
                  <tr key={c.id}>
                    <td><input type="checkbox" checked={!!selected[c.id]} onChange={()=> setSelected(s=> ({...s, [c.id]: !s[c.id]}))} aria-label={`اختيار ${c.id}`} /></td>
                    <td>
                      {tab==='users' ? (<div>{c.user?.name||c.user?.email||c.user?.id}</div>) : (<div>Guest</div>)}
                    </td>
                  <td>{tab==='users'? (c.user?.name||'-') : `زائر #${shortHash(String(c.sessionId||c.id||''))}`}</td>
                    <td style={{ direction:'ltr' }}>{tab==='users'? (c.user?.id||'-') : (c.sessionId||'-')}</td>
                    <td>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {(c.items||[]).map((it:any)=> (
                          <div key={it.id} className="panel" style={{ padding:6, display:'flex', alignItems:'center', gap:8 }}>
                            <img src={(it.product?.images?.[0]||'').toString()} alt={it.product?.name||''} style={{ width:28, height:28, objectFit:'cover', borderRadius:6 }} />
                            <div>
                              <div style={{ fontSize:12 }}>{it.product?.name}</div>
                              <div style={{ fontSize:11, color:'var(--sub)' }}>x{it.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>{new Date(c.updatedAt||c.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="panel" style={{ marginTop:16, padding:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr auto', gap:8, alignItems:'end' }}>
            <label>عنوان الإشعار<input value={notifyTitle} onChange={(e)=> setNotifyTitle(e.target.value)} className="input" /></label>
            <label>نص الإشعار<textarea value={notifyBody} onChange={(e)=> setNotifyBody(e.target.value)} rows={2} className="input" /></label>
            <button onClick={sendNotify} className="btn">إرسال إشعار</button>
          </div>
          <div style={{ color:'var(--sub)', fontSize:12, marginTop:6 }}>سيتم إرسال الإشعار إلى المحددين في الجدول أعلاه ({Object.values(selected).filter(Boolean).length}).</div>
        </div>
      </main>
    </div>
  );
}

