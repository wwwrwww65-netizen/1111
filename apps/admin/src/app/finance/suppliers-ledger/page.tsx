"use client";
import React from 'react';

export default function SuppliersLedgerPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">حسابات الموردين — كشف حساب</h1>
      <div className="toolbar">
        <input className="input" placeholder="مورد" />
        <button className="btn btn-sm">تصفية</button>
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>الوصف</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead>
          <tbody>
            <tr><td>2025-09-09</td><td>PO-0012</td><td>$0.00</td><td>$320.00</td><td>$1,540.00</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

