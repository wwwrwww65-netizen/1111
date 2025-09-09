"use client";
import React from 'react';

export default function AffiliateSettingsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">إعدادات برنامج العمولة</h1>
      <div className="grid cols-3">
        <input className="input" placeholder="تفعيل البرنامج (true/false)" />
        <input className="input" placeholder="مدة الكوكيز (أيام)" />
        <input className="input" placeholder="قاعدة العمولة (%)" />
      </div>
      <div className="mt-3"><button className="btn btn-md">حفظ</button></div>
    </div>
  );
}

