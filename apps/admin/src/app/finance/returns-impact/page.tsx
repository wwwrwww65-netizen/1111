"use client";
import React from 'react';

export default function ReturnsImpactPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">المرتجعات — الأثر المالي</h1>
      <div className="toolbar">
        <button className="btn btn-sm">تسجيل مرتجع</button>
        <button className="btn btn-sm">استرداد</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>رقم المرتجع</th><th>الطلب</th><th>الأثر</th><th>المورد/العميل</th></tr></thead>
          <tbody>
            <tr><td>RMA-5001</td><td>#1002</td><td>-$35.00</td><td>SUP-22</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

