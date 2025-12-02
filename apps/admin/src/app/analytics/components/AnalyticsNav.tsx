"use client";
import React from 'react';

export function AnalyticsNav(): JSX.Element {
  const [showAlerts, setShowAlerts] = React.useState<boolean>(false);
  React.useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const r = await fetch('/api/admin/analytics/alerts', { credentials:'include' });
        if (!alive) return;
        setShowAlerts(r.ok);
      } catch {
        if (!alive) return;
        setShowAlerts(false);
      }
    })();
    return ()=> { alive = false; };
  },[]);
  return (
    <nav aria-label="أقسام التحليلات" style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
      <a className="btn btn-outline" href="/analytics">نظرة عامة</a>
      <a className="btn btn-outline" href="/analytics/realtime">الزمن الحقيقي</a>
      <a className="btn btn-outline" href="/analytics/products">المنتجات</a>
      <a className="btn btn-outline" href="/analytics/funnels">مسارات التحويل</a>
      <a className="btn btn-outline" href="/analytics/acquisition">الاكتساب</a>
      <a className="btn btn-outline" href="/analytics/retention">الاحتفاظ</a>
      <a className="btn btn-outline" href="/analytics/orders">الإيرادات والطلبات</a>
      <a className="btn btn-outline" href="/analytics/sales">المبيعات</a>
      <a className="btn btn-outline" href="/analytics/vendors">الموردون</a>
      <a className="btn btn-outline" href="/analytics/potential">محتمل الشراء</a>
      <a className="btn btn-outline" href="/analytics/users">مستكشف المستخدم</a>
      {showAlerts && <a className="btn btn-outline" href="/analytics/alerts">التنبيهات</a>}
      <a className="btn btn-outline" href="/analytics/privacy">الخصوصية</a>
    </nav>
  );
}


