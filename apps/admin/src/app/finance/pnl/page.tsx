"use client";
import React from 'react';

export default function PnLPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">قوائم الدخل / P&L</h1>
      <div className="toolbar">
        <input className="input" placeholder="من" />
        <input className="input" placeholder="إلى" />
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>البند</th><th>القيمة</th></tr></thead>
          <tbody>
            <tr><td>المداخيل</td><td>$23,400</td></tr>
            <tr><td>المصروفات</td><td>$7,120</td></tr>
            <tr><td><b>الربح</b></td><td><b>$16,280</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

