"use client";
import React from 'react';

export default function DebugAuthPage(): JSX.Element {
  const [cookie, setCookie] = React.useState<string>("");
  const [headers, setHeaders] = React.useState<Array<[string,string]>>([]);
  React.useEffect(()=>{
    try { setCookie(document.cookie||""); } catch {}
    try {
      const hs: Array<[string,string]> = [];
      // No direct access to request headers on client; show navigator info instead
      hs.push(["location", typeof window!=="undefined" ? window.location.href : "-"]);
      hs.push(["protocol", typeof window!=="undefined" ? window.location.protocol : "-"]);
      setHeaders(hs);
    } catch {}
  },[]);
  return (
    <main style={{ padding:20 }}>
      <h1>_debug/auth</h1>
      <div style={{opacity:0.7,fontSize:12}}>ts: {new Date().toISOString()}</div>
      <p>Shows whether auth_token cookie is visible on this domain.</p>
      <div style={{whiteSpace:'pre-wrap',background:'#0f1420',padding:12,border:'1px solid #1c2333',borderRadius:8}}>
        <div><strong>document.cookie</strong>:</div>
        <div style={{marginTop:8}}>{cookie || '(empty)'}</div>
      </div>
      <div style={{marginTop:16}}>
        <strong>client</strong>
        <ul>
          {headers.map(([k,v]) => (<li key={k}><code>{k}</code>: {v}</li>))}
        </ul>
      </div>
      <div style={{marginTop:16}}>
        <a href="/login" className="btn">Go to login</a>
      </div>
    </main>
  );
}

