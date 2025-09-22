"use client";
import React from 'react';
import { resolveApiBase } from '../../lib/apiBase';

export default function LoyaltyPointsLogPage(): JSX.Element {
  const apiBase = resolveApiBase();
  const [rows, setRows] = React.useState<Array<{id:string;userId:string;points:number;reason:string;createdAt:string}>>([]);
  React.useEffect(()=>{ fetch(`${apiBase}/api/admin/points/log`, { credentials:'include' }).then(r=>r.json()).then(j=>setRows(j.entries||[])).catch(()=>setRows([])); },[apiBase]);
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">سجل معاملات النقاط</h1>
      <div className="toolbar">
        <input className="input" placeholder="بحث: المستخدم/العملية" />
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>المستخدم</th><th>التغير</th><th>السبب</th></tr></thead>
          <tbody>
            {rows.map(r=> (
              <tr key={r.id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.userId}</td><td>{r.points>0?`+${r.points}`:r.points}</td><td>{r.reason||'-'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

