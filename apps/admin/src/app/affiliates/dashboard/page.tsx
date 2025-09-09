"use client";
import React from 'react';

export default function AffiliateDashboardPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">لوحة المسوّق</h1>
      <div className="grid cols-3">
        <div className="card"><div>زيارات</div><div className="text-2xl">12,400</div></div>
        <div className="card"><div>مبيعات</div><div className="text-2xl">320</div></div>
        <div className="card"><div>العمولات</div><div className="text-2xl">$4,210</div></div>
      </div>
    </div>
  );
}

