"use client";
import React from 'react';

export default function LoyaltyPointsLogPage(): JSX.Element {
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
          <thead><tr><th>التاريخ</th><th>المستخدم</th><th>التغير</th><th>الرصيد</th><th>السبب</th></tr></thead>
          <tbody>
            <tr><td>2025-09-09</td><td>user@example.com</td><td>+200</td><td>1200</td><td>شراء</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

