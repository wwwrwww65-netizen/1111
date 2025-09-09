"use client";
import React from 'react';

export default function NotificationRulesPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">قواعد التنبيهات التلقائية</h1>
      <div className="toolbar">
        <button className="btn btn-sm">+ إضافة قاعدة</button>
        <select className="select"><option>القناة</option><option>بريد</option><option>Push</option><option>SMS</option></select>
      </div>
      <table className="table mt-3">
        <thead><tr><th>المشغل</th><th>القالب</th><th>القناة</th><th>الحالة</th></tr></thead>
        <tbody>
          <tr><td>order.created</td><td>تهنئة واستلام الطلب</td><td>بريد</td><td><span className="badge ok">مفعّل</span></td></tr>
        </tbody>
      </table>
    </div>
  );
}

