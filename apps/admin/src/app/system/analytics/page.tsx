"use client";
import React from 'react';
import { safeFetchJson, errorView } from '../../lib/http';

type TabKey = 'overview'|'top'|'funnels'|'segments'|'cohorts'|'realtime'|'utm';

export default function SystemAnalyticsPage(): JSX.Element {
  const [tab, setTab] = React.useState<TabKey>('overview');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [kpis, setKpis] = React.useState<any>({});
  const [top, setTop] = React.useState<any[]>([]);
  const [funnel, setFunnel] = React.useState<any>({});
  const [segments, setSegments] = React.useState<any>({});
  const [cohorts, setCohorts] = React.useState<any[]>([]);
  const [realtime, setRealtime] = React.useState<any>({});
  const [utm, setUtm] = React.useState<any[]>([]);

  async function load(){
    setLoading(true); setError('');
    try{
      const qs = (from||to)? `?from=${encodeURIComponent(from||'')}&to=${encodeURIComponent(to||'')}` : '';
      const [a, t, f, s, c, rt, u] = await Promise.all([
        safeFetchJson<any>(`/api/admin/analytics${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/top-products${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/funnels${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/segments${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/cohorts${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/realtime${qs}`),
        safeFetchJson<any>(`/api/admin/analytics/utm${qs}`),
      ]);
      if (!a.ok) setError(a.message||'failed');
      setKpis(a.ok? (a.data?.kpis||{}) : {});
      setTop(t.ok? (t.data?.items||[]) : []);
      setFunnel(f.ok? (f.data?.funnel||{}) : {});
      setSegments(s.ok? (s.data?.segments||{}) : {});
      setCohorts(c.ok? (c.data?.cohorts||[]) : []);
      setRealtime(rt.ok? (rt.data?.metrics||{}) : {});
      setUtm(u.ok? (u.data?.items||[]) : []);
    }catch{ setError('network'); }
    finally{ setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0 }}>الإحصاءات (النظام)</h1>
          <div className="toolbar" style={{ display:'flex', gap:8 }}>
            <input type="datetime-local" value={from} onChange={(e)=> setFrom(e.target.value)} className="input" />
            <input type="datetime-local" value={to} onChange={(e)=> setTo(e.target.value)} className="input" />
            <button onClick={load} className="btn btn-outline">تصفية</button>
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8 }} role="tablist" aria-label="تبويبات الإحصاءات">
          <button role="tab" aria-selected={tab==='overview'} onClick={()=> setTab('overview')} className={`btn ${tab==='overview'?'':'btn-outline'}`}>نظرة عامة</button>
          <button role="tab" aria-selected={tab==='top'} onClick={()=> setTab('top')} className={`btn ${tab==='top'?'':'btn-outline'}`}>الأعلى مبيعاً</button>
          <button role="tab" aria-selected={tab==='funnels'} onClick={()=> setTab('funnels')} className={`btn ${tab==='funnels'?'':'btn-outline'}`}>مسارات التحويل</button>
          <button role="tab" aria-selected={tab==='segments'} onClick={()=> setTab('segments')} className={`btn ${tab==='segments'?'':'btn-outline'}`}>الشرائح</button>
          <button role="tab" aria-selected={tab==='cohorts'} onClick={()=> setTab('cohorts')} className={`btn ${tab==='cohorts'?'':'btn-outline'}`}>Cohorts</button>
          <button role="tab" aria-selected={tab==='realtime'} onClick={()=> setTab('realtime')} className={`btn ${tab==='realtime'?'':'btn-outline'}`}>Realtime</button>
          <button role="tab" aria-selected={tab==='utm'} onClick={()=> setTab('utm')} className={`btn ${tab==='utm'?'':'btn-outline'}`}>UTM</button>
        </div>

        {loading ? <div role="status" aria-busy="true" className="skeleton" style={{ height: 240 }} /> : error ? errorView(error, load) : (
          <section style={{ marginTop:12 }}>
            {tab==='overview' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
                <Card label="المستخدمون" value={kpis.users ?? '-'} />
                <Card label="نشطون" value={kpis.usersActive ?? '-'} />
                <Card label="الطلبات" value={kpis.orders ?? '-'} />
                <Card label="الإيرادات" value={kpis.revenue ?? '-'} />
                <Card label="مشاهدات الصفحات" value={kpis.pageViews ?? '-'} />
              </div>
            )}
            {tab==='top' && (
              <div style={{ display:'grid', gap:8 }}>
                {top.map((it)=> (
                  <div key={it.productId} className="panel" style={{ padding:10, display:'flex', alignItems:'center', gap:10 }}>
                    <img src={(it.product?.images?.[0]||'').toString()} alt={it.product?.name||''} style={{ width:42, height:42, objectFit:'cover', borderRadius:8 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600 }}>{it.product?.name||it.productId}</div>
                      <div style={{ color:'var(--sub)', fontSize:12 }}>الكمية: {it.qty}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab==='funnels' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
                <Card label="جلسات" value={funnel.sessions ?? '-'} />
                <Card label="إضافة للسلة" value={funnel.addToCart ?? '-'} />
                <Card label="الدفع" value={funnel.checkouts ?? '-'} />
                <Card label="مشتريات" value={funnel.purchased ?? '-'} />
              </div>
            )}
            {tab==='segments' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
                <Card label="عدد المستخدمين" value={segments.totalUsers ?? '-'} />
                <Card label="جدد (30يوم)" value={segments.newUsers30d ?? '-'} />
                <Card label="سلال الزوار" value={segments.guestCarts ?? '-'} />
                <Card label="سلال المستخدمين" value={segments.userCarts ?? '-'} />
              </div>
            )}
            {tab==='cohorts' && (
              <div style={{ display:'grid', gap:8 }}>
                {cohorts.map((row:any)=> (
                  <div key={row.weekStart} className="panel" style={{ padding:10, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    <div>الأسبوع: {row.weekStart}</div>
                    <div>مستخدمون جدد: {row.newUsers}</div>
                    <div>طلبات لاحقة W+1/W+2: {row.week1Orders}/{row.week2Orders}</div>
                  </div>
                ))}
              </div>
            )}
            {tab==='realtime' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
                <Card label="page_view (5m)" value={realtime.page_view ?? 0} />
                <Card label="add_to_cart (5m)" value={realtime.add_to_cart ?? 0} />
                <Card label="checkout (5m)" value={realtime.checkout ?? 0} />
                <Card label="purchase (5m)" value={realtime.purchase ?? 0} />
              </div>
            )}
            {tab==='utm' && (
              <div style={{ overflowX:'auto' }}>
                <table className="table" role="table" aria-label="UTM Summary">
                  <thead><tr><th>source</th><th>medium</th><th>campaign</th><th>count</th></tr></thead>
                  <tbody>
                    {utm.map((r:any, idx:number)=> (
                      <tr key={idx}><td>{r.source}</td><td>{r.medium}</td><td>{r.campaign}</td><td>{r.cnt}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }): JSX.Element {
  return (
    <div className="panel" style={{ padding:12 }}>
      <div style={{ color:'var(--sub)' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700 }}>{value}</div>
    </div>
  );
}

