"use client";
import React from 'react';

export default function CashflowPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التدفق النقدي</h1>
      <div className="grid cols-3">
        <div className="card"><div>الرصيد الحالي</div><div className="text-2xl">$12,340</div></div>
        <div className="card"><div>توقع 30 يوم</div><div className="text-2xl">$5,120</div></div>
        <div className="card"><div>دفعات مستحقة</div><div className="text-2xl">$2,450</div></div>
      </div>
      <div className="mt-3">
        <div className="toolbar">
          <button className="btn btn-sm">محاكاة سيناريو</button>
          <select className="select"><option>30 يوم</option><option>60 يوم</option><option>90 يوم</option></select>
        </div>
        <div className="mt-2 text-sm text-gray-400">(مخطط زمني هنا)</div>
      </div>
    </div>
  );
}

