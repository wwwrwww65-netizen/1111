"use client";
import React from 'react';

export default function AffiliatesListPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة المسوّقين</h1>
      <div className="toolbar">
        <input className="input" placeholder="بحث" />
        <select className="select"><option>الحالة</option><option>نشط</option><option>موقوف</option></select>
        <button className="btn btn-sm">تصدير CSV</button>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المسوّق</th><th>زيارات</th><th>مبيعات</th><th>عمولات</th><th>دفعات</th></tr></thead>
        <tbody>
          <tr><td>marketer@jeeey.com</td><td>12,400</td><td>320</td><td>$4,210</td><td>$3,500</td></tr>
        </tbody>
      </table>
    </div>
  );
}

