"use client";
import React from 'react';
import { resolveApiBase } from "../../lib/apiBase";
import { AnalyticsNav } from "../components/AnalyticsNav";
import { safeFetchJson } from "../../lib/http";

export default function FunnelsPage(): JSX.Element {
  const apiBase = React.useMemo(()=> resolveApiBase(), []);
  const [funnel, setFunnel] = React.useState<{ sessions:number; addToCart:number; checkouts:number; purchased:number }>({ sessions:0, addToCart:0, checkouts:0, purchased:0 });
  const [busy, setBusy] = React.useState(true);
  const [err, setErr] = React.useState('');

  React.useEffect(()=>{ (async()=>{
    try{
      setErr('');
      const r = await safeFetchJson<{ funnel:any }>(`${apiBase}/api/admin/analytics/funnels`);
      if (r.ok) setFunnel(r.data?.funnel||{}); else setErr(r.message||'failed');
    }
    finally{ setBusy(false); }
  })(); }, [apiBase]);

  return (
    <main className="container">
      <div className="panel" style={{ padding:16 }}>
        <AnalyticsNav />
        <h1 style={{ marginTop:0 }}>مسارات التحويل</h1>
        <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
          <Card label="جلسات" value={funnel.sessions} />
          <Card label="إضافة للسلة" value={funnel.addToCart} />
          <Card label="الدفع" value={funnel.checkouts} />
          <Card label="مشتريات" value={funnel.purchased} />
        </div>
        <div style={{ marginTop:16 }}>
          <SimpleFunnel a={funnel.sessions} b={funnel.addToCart} c={funnel.checkouts} d={funnel.purchased} />
        </div>
        {!busy && (funnel.sessions===0) && !err && <div style={{ color:'var(--sub)', marginTop:12 }}>لا توجد بيانات</div>}
        {!!err && <div className="error" style={{ marginTop:12 }}>{err}</div>}
      </div>
    </main>
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

function SimpleFunnel({ a, b, c, d }: { a:number; b:number; c:number; d:number }): JSX.Element {
  const ref = React.useRef<HTMLDivElement|null>(null);
  const chartRef = React.useRef<any>(null);
  React.useEffect(()=>{
    let disposed = false;
    async function ensure(){
      if (!ref.current) return;
      if (!(window as any).echarts) {
        await new Promise<void>((resolve)=>{
          const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js'; s.onload = ()=> resolve(); document.body.appendChild(s);
        });
      }
      if (disposed) return;
      const echarts = (window as any).echarts;
      chartRef.current = echarts.init(ref.current);
      const data = [
        { name:'Sessions', value:a },
        { name:'Add to Cart', value:b },
        { name:'Checkout', value:c },
        { name:'Purchased', value:d },
      ];
      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger:'item' },
        series: [
          { type:'funnel', left:'10%', width:'80%', label:{ color:'#e2e8f0' }, itemStyle:{ opacity:0.9 }, data }
        ]
      };
      chartRef.current.setOption(option);
      window.addEventListener('resize', resize);
    }
    function resize(){ try { chartRef.current && chartRef.current.resize(); } catch {}
    }
    ensure();
    return ()=> { disposed = true; window.removeEventListener('resize', resize); try { chartRef.current && chartRef.current.dispose(); } catch {} };
  }, [a,b,c,d]);
  return <div ref={ref} style={{ width:'100%', height: 320 }} />;
}


