"use client";
import React from 'react';

export default function NotificationsPage(): JSX.Element {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>الإشعارات</h1>
      <p style={{ opacity: 0.8 }}>هذه الصفحة فارغة مبدئيًا. سنضيف إدارة الإشعارات لاحقًا.</p>
      <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>الحالة</div>
        <div>لا توجد عناصر لعرضها.</div>
      </div>
    </div>
  );
}

export default function NotificationsPage(): JSX.Element {
  return (
    <main style={{padding:'16px'}}>
      <h1>الإشعارات</h1>
      <p>قريباً: إرسال بريد/إشعار دفع، إعداد قوالب ورسائل.</p>
    </main>
  );
}

