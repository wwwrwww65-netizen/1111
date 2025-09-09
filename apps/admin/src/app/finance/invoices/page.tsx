"use client";
import React from 'react';

export default function InvoicesPaymentsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">الفواتير والمدفوعات</h1>
      <div className="toolbar">
        <select className="select"><option>الكل</option><option>مدفوعة</option><option>جزئي</option><option>مستحقة</option></select>
        <button className="btn btn-sm">تسوية دفعات</button>
        <button className="btn btn-sm">تصدير CSV</button>
        <button className="btn btn-sm btn-outline">تصدير PDF</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>#</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>إجراءات</th></tr></thead>
          <tbody>
            <tr><td>INV-1001</td><td>عميل 1</td><td>$200</td><td><span className="badge ok">مدفوعة</span></td><td><button className="btn btn-sm btn-outline">طباعة</button></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

