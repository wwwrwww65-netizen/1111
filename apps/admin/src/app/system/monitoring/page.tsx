"use client";
import React from 'react';

export default function MonitoringPage(): JSX.Element {
  const [api, setApi] = React.useState<any>(null);
  const [socket, setSocket] = React.useState<'ok'|'down'|'unknown'>('unknown');
  const [db, setDb] = React.useState<'ok'|'down'|'unknown'>('unknown');
  const [ts, setTs] = React.useState<number>(0);

  async function ping() {
    try {
      const r = await fetch('/api/admin/health', { cache:'no-store' });
      const j = await r.json();
      setApi(j);
      setTs(Date.now());
      setDb(j.ok ? 'ok' : 'down');
    } catch { setApi(null); setDb('down'); }
  }
  React.useEffect(()=>{ ping(); const t = setInterval(ping, 15000); return ()=> clearInterval(t); }, []);

  React.useEffect(()=>{
    let s: any;
    (async ()=>{
      try {
        // Lightweight runtime import without bundling socket client; assume frontend has it or use native ws
        const { io } = await import('socket.io-client');
        s = io('/', { transports:['websocket'], timeout: 4000 });
        s.on('connect', ()=> setSocket('ok'));
        s.on('connect_error', ()=> setSocket('down'));
        s.on('disconnect', ()=> setSocket('down'));
      } catch { setSocket('down'); }
    })();
    return ()=> { try { s?.close?.(); } catch {} };
  }, []);

  function Badge({label, state}:{label:string; state:'ok'|'down'|'unknown'}){
    const color = state==='ok' ? '#10b981' : state==='down' ? '#ef4444' : '#9ca3af';
    return <span style={{ background: color, color:'#0b1020', padding:'4px 8px', borderRadius:8 }}>{label}: {state}</span>;
  }

  return (
    <div className="container">
      <main className="panel" style={{ padding:16 }}>
        <h1 style={{ marginTop:0 }}>Monitoring</h1>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
          <Badge label="API" state={api?.ok? 'ok':'down'} />
          <Badge label="DB" state={db} />
          <Badge label="Socket" state={socket} />
          <span style={{ color:'var(--sub)', marginInlineStart:8 }}>آخر فحص: {ts? new Date(ts).toLocaleTimeString(): '—'}</span>
        </div>
        <div className="panel" style={{ padding:12 }}>
          <div style={{ color:'var(--sub)', marginBottom:6 }}>Health payload</div>
          <pre style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(api, null, 2)}</pre>
        </div>
      </main>
    </div>
  );
}

