"use client";
import React from 'react';

export default function TargetedNotificationsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التنبيهات المخصّصة</h1>
      <div className="toolbar">
        <input className="input" placeholder="شرط الاستهداف (DSL)" />
        <button className="btn btn-sm">اختبار</button>
      </div>
      <div className="text-sm text-gray-400">نتائج الاستعلام ستظهر هنا (عدد المستخدمين المستهدفين).</div>
    </div>
  );
}

