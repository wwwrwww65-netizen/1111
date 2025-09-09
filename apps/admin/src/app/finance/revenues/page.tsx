"use client";
import React from 'react';

export default function RevenuesPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة المداخيل</h1>
      <div className="toolbar">
        <select className="select"><option>اليوم</option><option>الأسبوع</option><option>الشهر</option></select>
        <input className="input" placeholder="المصدر/القناة" />
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>المصدر</th><th>المبلغ</th><th>الطلب</th><th>فاتورة</th></tr></thead>
          <tbody>
            <tr><td>2025-09-09</td><td>بوابة الدفع</td><td>$120.00</td><td>#1001</td><td>INV-1001</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

