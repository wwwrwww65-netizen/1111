"use client";
import React from 'react';

export default function ExpensesPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المصروفات</h1>
      <div className="toolbar">
        <button className="btn btn-sm">+ إضافة مصروف</button>
        <select className="select"><option>جميع التصنيفات</option><option>شحن</option><option>تسويق</option><option>تشغيل</option></select>
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>التاريخ</th><th>التصنيف</th><th>الوصف</th><th>المبلغ</th><th>فاتورة/مورد</th></tr></thead>
          <tbody>
            <tr><td>2025-09-09</td><td>شحن</td><td>تكلفة توصيل</td><td>$45.00</td><td>SUP-22</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

