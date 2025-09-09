"use client";
import React from 'react';

export default function LoyaltyPointsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إدارة النقاط</h1>
      <div className="toolbar">
        <input className="input" placeholder="قيمة النقطة" />
        <input className="input" placeholder="الصلاحية (أيام)" />
        <button className="btn btn-sm">حفظ</button>
        <button className="btn btn-sm btn-outline">تعديل يدوي</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>المستخدم</th><th>الرصيد</th><th>آخر تحديث</th></tr></thead>
          <tbody>
            <tr><td>user@example.com</td><td>1200</td><td>2025-09-09</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

