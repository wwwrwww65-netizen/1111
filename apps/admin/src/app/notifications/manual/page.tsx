"use client";
import React from 'react';

export default function ManualCampaignsPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">التنبيهات اليدوية</h1>
      <div className="grid cols-3">
        <input className="input" placeholder="العنوان" />
        <select className="select"><option>القناة</option><option>بريد</option><option>Push</option><option>SMS</option></select>
        <input className="input" placeholder="جدولة (ISO)" />
      </div>
      <textarea className="input" placeholder="المحتوى" style={{minHeight:140}} />
      <div className="mt-2"><button className="btn btn-md">إرسال/جدولة</button></div>
    </div>
  );
}

