"use client";
import React from 'react';

export default function AffiliatePayoutsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">تقارير المدفوعات للمسوّقين</h1>
      <div className="toolbar">
        <select className="select"><option>الحالة</option><option>مدفوع</option><option>معلّق</option></select>
        <button className="btn btn-sm">تصدير CSV</button>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المسوّق</th><th>الفترة</th><th>المبلغ</th><th>الحالة</th></tr></thead>
        <tbody>
          <tr><td>marketer@jeeey.com</td><td>2025-08</td><td>$820</td><td><span className="badge ok">مدفوع</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}

