"use client";
import React from 'react';

export default function DebugAuthPage(): JSX.Element {
  const [cookie, setCookie] = React.useState<string>('');
  React.useEffect(() => {
    try { setCookie(document.cookie || ''); } catch {}
  }, []);
  return (
    <main style={{ padding:20 }}>
      <h1>/debug/auth</h1>
      <p>عرض حالة المصادقة والكوكيز في هذا النطاق.</p>
      <div style={{whiteSpace:'pre-wrap',background:'#0f1420',padding:12,border:'1px solid #1c2333',borderRadius:8}}>
        <div><strong>document.cookie</strong>:</div>
        <div style={{marginTop:8}}>{cookie || '(empty)'}</div>
      </div>
    </main>
  );
}

