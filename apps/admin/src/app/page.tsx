"use client";
import React from 'react';
import { resolveApiBase } from "./lib/apiBase";

export const dynamic = 'force-dynamic';

export default function AdminHome(): JSX.Element {
  const [kpis, setKpis] = React.useState<{users?:number;orders?:number;revenue?:number}>({});
  const [series, setSeries] = React.useState<{day:string;orders:number;revenue:number}[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [recentTickets, setRecentTickets] = React.useState<any[]>([]);
  const [driversOnline, setDriversOnline] = React.useState<number>(0);
  const [lastSeenAgo, setLastSeenAgo] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  // Filters
  const [range, setRange] = React.useState<'7d'|'30d'|'90d'|'custom'>('7d');
  const [start, setStart] = React.useState<string>('');
  const [end, setEnd] = React.useState<string>('');
  const [costCenter, setCostCenter] = React.useState<string>('all');
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const authHeaders = React.useCallback(()=>{
    if (typeof document === 'undefined') return {} as Record<string,string>;
    const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
    let token = m ? m[1] : '';
    try { token = decodeURIComponent(token); } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);
  const load = React.useCallback(async()=>{
    try{ setBusy(true);
      const days = range==='7d'?7: range==='30d'?30: range==='90d'?90: 7;
      const qs: string[] = [];
      if (range==='custom' && start && end) { qs.push(`start=${encodeURIComponent(start)}`); qs.push(`end=${encodeURIComponent(end)}`); }
      else { qs.push(`days=${days}`); }
      if (costCenter && costCenter!=='all') qs.push(`costCenter=${encodeURIComponent(costCenter)}`);
      const seriesUrl = `/api/admin/analytics/series?${qs.join('&')}`;
      const kpiUrl = `/api/admin/analytics${qs.length?`?${qs.join('&')}`:''}`;
      const [ak, ao, at, as] = await Promise.all([
        fetch(kpiUrl, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({kpis:{}})),
        fetch(`/api/admin/orders/list?page=1&limit=5`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({orders:[]})),
        fetch(`/api/admin/tickets?page=1&limit=5`, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({tickets:[]})),
        fetch(seriesUrl, { credentials:'include', headers: { ...authHeaders() }, cache:'no-store' }).then(r=>r.json()).catch(()=>({series:[]})),
      ]);
      setKpis(ak.kpis||{});
      setRecentOrders(ao.orders||[]);
      setRecentTickets(at.tickets||[]);
      setSeries(as.series||[]);
    } finally { setBusy(false); }
  }, [apiBase, authHeaders, range, start, end, costCenter]);
  React.useEffect(()=>{ load().catch(()=>{}); },[load]);

  function exportSeriesCsv(){
    const lines = [
      ['day','orders','revenue'],
      ...series.map(s=> [s.day, String(s.orders), String(s.revenue)])
    ];
    const csv = lines.map(r=> r.map(v=> /[",\n]/.test(String(v))? '"'+String(v).replace(/"/g,'""')+'"' : String(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(()=> URL.revokeObjectURL(a.href), 3000);
  }
  // Realtime drivers count using socket.io (from API)
  React.useEffect(()=>{
    let socket: any;
    let timer: any;
    const updateAgo = (iso?: string)=>{
      if (!iso) { setLastSeenAgo(''); return; }
      const diff = Math.max(0, Date.now() - new Date(iso).getTime());
      const m = Math.floor(diff/60000); const s = Math.floor((diff%60000)/1000);
      setLastSeenAgo(`${m}m ${s}s`);
    };
    const tickAgo = ()=> updateAgo((window as any).__lastDriverSeen);
    (async ()=>{
      if (!(window as any).io) {
        await new Promise<void>((resolve)=>{ const s=document.createElement('script'); s.src='https://cdn.socket.io/4.7.2/socket.io.min.js'; s.onload=()=> resolve(); document.body.appendChild(s); });
      }
      const origin = window.location.origin;
      socket = (window as any).io(origin.replace('//admin.','//api.'), { transports:['websocket'], withCredentials:true });
      socket.on('driver:locations', (payload:any)=>{
        const arr = payload?.drivers||[];
        setDriversOnline(Array.isArray(arr)? arr.length : 0);
        const maxSeen = arr.reduce((acc:any, d:any)=> {
          const t = d?.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
          return t>acc ? t : acc;
        }, 0);
        (window as any).__lastDriverSeen = maxSeen ? new Date(maxSeen).toISOString() : undefined;
        tickAgo();
      });
      timer = setInterval(tickAgo, 1000);
    })();
    return ()=> { try { socket && socket.disconnect(); } catch {}; if (timer) clearInterval(timer); };
  }, [apiBase]);
  return (
    <div className="grid" style={{gap:16}}>
      <div className="panel" style={{display:'grid',gap:12}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
          <label style={{display:'grid',gap:4}}>
            <span style={{fontSize:12,color:'var(--sub)'}}>النطاق الزمني</span>
            <select className="input" value={range} onChange={e=> setRange(e.target.value as any)}>
              <option value="7d">آخر 7 أيام</option>
              <option value="30d">آخر 30 يوم</option>
              <option value="90d">آخر 90 يوم</option>
              <option value="custom">مخصص</option>
            </select>
          </label>
          {range==='custom' && (
            <>
              <label style={{display:'grid',gap:4}}>
                <span style={{fontSize:12,color:'var(--sub)'}}>من</span>
                <input className="input" type="date" value={start} onChange={e=> setStart(e.target.value)} />
              </label>
              <label style={{display:'grid',gap:4}}>
                <span style={{fontSize:12,color:'var(--sub)'}}>إلى</span>
                <input className="input" type="date" value={end} onChange={e=> setEnd(e.target.value)} />
              </label>
            </>
          )}
          <label style={{display:'grid',gap:4}}>
            <span style={{fontSize:12,color:'var(--sub)'}}>مركز التكلفة</span>
            <select className="input" value={costCenter} onChange={e=> setCostCenter(e.target.value)}>
              <option value="all">الكل</option>
              <option value="marketing">التسويق</option>
              <option value="shipping">الشحن</option>
              <option value="operations">التشغيل</option>
              <option value="development">التطوير</option>
            </select>
          </label>
          <div style={{marginInlineStart:'auto',display:'flex',gap:8}}>
            <button className="btn btn-outline" onClick={()=> load()} disabled={busy}>تحديث</button>
            <button className="btn" onClick={exportSeriesCsv}>تصدير CSV</button>
          </div>
        </div>
      </div>
      <div style={{
        padding:'14px 16px',
        border:'1px solid #1c2333',
        borderRadius:12,
        background:'linear-gradient(90deg,#0f1420 0%, #101939 100%)',
        color:'#e2e8f0',
        boxShadow:'0 2px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:6}}>هـــــَـذا من فـــْـــضل ربــّــــي ...</div>
        <div style={{opacity:0.9,fontSize:16,marginTop:4}}>مرحباً بك يامدير 👋🏻😉</div>
        <div style={{opacity:0.85,fontSize:14,marginTop:8}}>هذه جهودات رجال الأعمال تحية خاصة لهم 🫡</div>
        <div style={{opacity:0.8,fontSize:13,marginTop:4}}>هاشم الجائفي ( هـــَـش ) - هشام الجائفي ( مستر ) - عمر عبيد ( غوبر )</div>
      </div>
      <div className="grid cols-3">
        <div className="card"><div style={{color:'var(--sub)'}}>المستخدمون</div><div style={{fontSize:28,fontWeight:800}}>{kpis.users ?? (busy?'…':'-')}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>الطلبات</div><div style={{fontSize:28,fontWeight:800}}>{kpis.orders ?? (busy?'…':'-')}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>الإيرادات</div><div style={{fontSize:28,fontWeight:800}}>{typeof kpis.revenue==='number'? kpis.revenue.toLocaleString() : (busy?'…':'-')}</div></div>
      </div>
      <div className="grid cols-3">
        <div className="card"><div style={{color:'var(--sub)'}}>السائقون المتصلون</div><div style={{fontSize:28,fontWeight:800}}>{driversOnline}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>آخر مشاهدة سائق</div><div style={{fontSize:28,fontWeight:800}}>{lastSeenAgo || '—'}</div></div>
        <div className="card"><div style={{color:'var(--sub)'}}>صحة النظام</div><SystemHealthBadge apiBase={apiBase} /></div>
      </div>
      <div className="panel">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0}}>إجراءات سريعة</h3>
        </div>
        <div className="grid cols-3">
          <a href="/products/new" className="btn" style={{textAlign:'center'}}>إضافة منتج</a>
          <a href="/coupons" className="btn" style={{textAlign:'center'}}>إنشاء كوبون</a>
          <a href="/vendors" className="btn" style={{textAlign:'center'}}>إضافة مورد</a>
        </div>
      </div>
      <div className="panel">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0}}>أحداث حديثة</h3>
          <a href="/orders" className="btn btn-outline">عرض السجل</a>
        </div>
        <RecentEvents apiBase={apiBase} />
      </div>
      <div className="panel">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{margin:0}}>إحصائيات 7 أيام</h3>
        </div>
        <ChartOrdersRevenue series={series} />
      </div>
      <div className="grid cols-2">
        <div className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0}}>آخر الطلبات</h3>
            <a href="/orders" className="btn">عرض الكل</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
              <thead><tr>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المعرف</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المستخدم</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الحالة</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الإجمالي</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>التاريخ</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((o:any, idx:number)=> (
                  <tr key={o.id} style={{background: idx%2? '#0a0e17':'transparent'}}>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.id}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.user?.email||'-'}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.status}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{o.total}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!recentOrders.length && (
                  <tr><td colSpan={5} style={{padding:10,color:'var(--sub)'}}>{busy?'...':'لا توجد بيانات'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0}}>أحدث التذاكر</h3>
            <a href="/tickets" className="btn">عرض الكل</a>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0}}>
              <thead><tr>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>رقم</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الموضوع</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الحالة</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>الأولوية</th>
                <th style={{textAlign:'right',padding:10,borderBottom:'1px solid var(--muted)'}}>المستخدم</th>
              </tr></thead>
              <tbody>
                {recentTickets.map((t:any, idx:number)=> (
                  <tr key={t.id} style={{background: idx%2? '#0a0e17':'transparent'}}>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.id}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.subject}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.status}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.priority}</td>
                    <td style={{padding:10,borderBottom:'1px solid var(--muted)'}}>{t.user?.email||'-'}</td>
                  </tr>
                ))}
                {!recentTickets.length && (
                  <tr><td colSpan={5} style={{padding:10,color:'var(--sub)'}}>{busy?'...':'لا توجد بيانات'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartOrdersRevenue({ series }: { series: Array<{ day:string; orders:number; revenue:number }> }): JSX.Element {
  const ref = React.useRef<HTMLDivElement|null>(null);
  const chartRef = React.useRef<any>(null);
  React.useEffect(()=>{
    let disposed = false;
    async function ensure(){
      if (!ref.current) return;
      if (!(window as any).echarts) {
        await new Promise<void>((resolve)=>{
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';
          s.onload = ()=> resolve();
          document.body.appendChild(s);
        });
      }
      if (disposed) return;
      const echarts = (window as any).echarts;
      chartRef.current = echarts.init(ref.current);
      const option = {
        backgroundColor: 'transparent',
        textStyle: { color: '#e2e8f0' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['الطلبات','الإيرادات'], textStyle:{ color:'#cbd5e1' } },
        grid: { left: 36, right: 18, top: 30, bottom: 28 },
        xAxis: { type:'category', data: series.map(s=> s.day), axisLine:{ lineStyle:{ color:'#334155' } } },
        yAxis: [
          { type:'value', name:'طلبات', axisLine:{ lineStyle:{ color:'#334155' } }, splitLine:{ lineStyle:{ color:'#172036' } } },
          { type:'value', name:'ريال', axisLine:{ lineStyle:{ color:'#334155' } }, splitLine:{ show:false } }
        ],
        series: [
          { name:'الطلبات', type:'bar', data: series.map(s=> s.orders), itemStyle:{ color:'#22c55e' } },
          { name:'الإيرادات', type:'line', yAxisIndex:1, data: series.map(s=> s.revenue), itemStyle:{ color:'#0ea5e9' }, smooth:true }
        ]
      };
      chartRef.current.setOption(option);
      window.addEventListener('resize', resize);
    }
    function resize(){ try { chartRef.current && chartRef.current.resize(); } catch {}
    }
    ensure();
    return ()=> { disposed = true; window.removeEventListener('resize', resize); try { chartRef.current && chartRef.current.dispose(); } catch {} };
  }, [series]);
  return <div ref={ref} style={{ width:'100%', height: 280 }} />;
}

function SystemHealthBadge({ apiBase }: { apiBase: string }): JSX.Element {
  const [state, setState] = React.useState<{ok?:boolean;db?:boolean;version?:string}>({});
  React.useEffect(()=>{
    let t: any;
    const load = async()=>{
      try { const j = await (await fetch(`/api/admin/system/health`, { credentials:'include' })).json(); setState(j||{}); }
      catch { setState({ ok:false }); }
    };
    load(); t = setInterval(load, 15000); return ()=> clearInterval(t);
  }, [apiBase]);
  const ok = state.ok && state.db;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span className={`badge ${ok? 'ok':'warn'}`}>{ok? 'OK':'تحقق'}</span>
      <span style={{ color:'var(--sub)', fontSize:12 }}>v{state.version||'dev'}</span>
    </div>
  );
}

function RecentEvents({ apiBase }: { apiBase: string }): JSX.Element {
  const [rows, setRows] = React.useState<Array<{type:string;id:string;message:string;at:string}>>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(()=>{
    let t: any;
    const load = async()=>{
      setLoading(true);
      try { const j = await (await fetch(`/api/admin/notifications/recent`, { credentials:'include' })).json(); setRows(j.events||[]); }
      catch { setRows([]); }
      finally { setLoading(false); }
    };
    load(); t = setInterval(load, 15000); return ()=> clearInterval(t);
  }, [apiBase]);
  if (loading) return <div className="skeleton-table-row" />;
  if (!rows.length) return <div className="empty-state">لا توجد أحداث</div>;
  return (
    <div style={{ overflowX:'auto' }}>
      <table className="table">
        <thead><tr><th>النوع</th><th>الوصف</th><th>الوقت</th></tr></thead>
        <tbody>
          {rows.map((e)=> (
            <tr key={`${e.type}:${e.id}`}>
              <td>{e.type}</td>
              <td>{e.message}</td>
              <td>{new Date(e.at||Date.now()).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}