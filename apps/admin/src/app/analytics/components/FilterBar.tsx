"use client";
import React from 'react';

export type AnalyticsFilters = {
  from?: string;
  to?: string;
  granularity?: 'minute'|'hour'|'day'|'week'|'month';
  compare?: boolean;
  device?: 'mobile'|'desktop'|'app'|'';
  country?: string;
  channel?: 'organic'|'paid'|'referral'|'email'|'push'|'social'|'display'|'';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  currency?: 'SAR'|'AED'|'USD'|'';
  page?: 'home'|'product'|'category'|'cart'|'checkout'|'';
  userSegment?: 'all'|'new_30d'|'returning'|'vip'|'';
};

export function FilterBar({ value, onChange, onApply, compact=false }:{ value: AnalyticsFilters; onChange: (v: AnalyticsFilters)=> void; onApply?: ()=> void; compact?: boolean }): JSX.Element {
  const v = value||{};
  function set<K extends keyof AnalyticsFilters>(k: K, val: AnalyticsFilters[K]){ onChange({ ...v, [k]: val }); }
  return (
    <div className="panel" style={{ padding:12, display:'grid', gap:8 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <label>من<input type="datetime-local" className="input" value={v.from||''} onChange={(e)=> set('from', e.target.value)} /></label>
        <label>إلى<input type="datetime-local" className="input" value={v.to||''} onChange={(e)=> set('to', e.target.value)} /></label>
        <select className="input" onChange={(e)=>{
          const preset = e.target.value;
          const now = new Date();
          let from = ''; let to = '';
          if (preset==='today') { const d=new Date(); from=d.toISOString().slice(0,10)+'T00:00'; to=d.toISOString().slice(0,10)+'T23:59'; }
          else if (preset==='7d') { const d=new Date(Date.now()-7*24*3600*1000); from=d.toISOString().slice(0,16); to=now.toISOString().slice(0,16); }
          else if (preset==='30d') { const d=new Date(Date.now()-30*24*3600*1000); from=d.toISOString().slice(0,16); to=now.toISOString().slice(0,16); }
          else if (preset==='month') { const d=new Date(now.getFullYear(), now.getMonth(), 1); from=d.toISOString().slice(0,16); to=now.toISOString().slice(0,16); }
          if (from && to) onChange({ ...v, from, to });
        }} defaultValue="">
          <option value="">نطاق زمني</option>
          <option value="today">اليوم</option>
          <option value="7d">آخر 7 أيام</option>
          <option value="30d">آخر 30 يوم</option>
          <option value="month">هذا الشهر</option>
        </select>
        <select className="input" value={v.granularity||'day'} onChange={(e)=> set('granularity', e.target.value as any)}>
          <option value="minute">دقيقة</option>
          <option value="hour">ساعة</option>
          <option value="day">يوم</option>
          <option value="week">أسبوع</option>
          <option value="month">شهر</option>
        </select>
        <label style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
          <input type="checkbox" checked={!!v.compare} onChange={(e)=> set('compare', e.target.checked)} />
          مقارنة بالفترة السابقة
        </label>
      </div>
      {!compact && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select className="input" value={v.device||''} onChange={(e)=> set('device', e.target.value as any)}>
            <option value="">كل الأجهزة</option>
            <option value="mobile">جوال</option>
            <option value="desktop">سطح مكتب</option>
            <option value="app">تطبيق</option>
          </select>
          <select className="input" value={v.country||''} onChange={(e)=> set('country', e.target.value)}>
            <option value="">كل الدول</option>
            <option value="SA">السعودية</option>
            <option value="AE">الإمارات</option>
            <option value="EG">مصر</option>
            <option value="KW">الكويت</option>
            <option value="QA">قطر</option>
            <option value="BH">البحرين</option>
            <option value="OM">عُمان</option>
            <option value="JO">الأردن</option>
            <option value="MA">المغرب</option>
            <option value="DZ">الجزائر</option>
            <option value="TN">تونس</option>
          </select>
          <select className="input" value={v.channel||''} onChange={(e)=> set('channel', e.target.value as any)}>
            <option value="">كل القنوات</option>
            <option value="organic">عضوي</option>
            <option value="paid">مدفوع</option>
            <option value="referral">إحالة</option>
            <option value="email">بريد</option>
            <option value="push">دفع</option>
            <option value="social">اجتماعي</option>
            <option value="display">عرضي</option>
          </select>
          <select className="input" value={v.utmSource||''} onChange={(e)=> set('utmSource', e.target.value)}>
            <option value="">utm_source</option>
            <option value="facebook">facebook</option>
            <option value="google">google</option>
            <option value="instagram">instagram</option>
            <option value="tiktok">tiktok</option>
            <option value="email">email</option>
          </select>
          <select className="input" value={v.utmMedium||''} onChange={(e)=> set('utmMedium', e.target.value)}>
            <option value="">utm_medium</option>
            <option value="cpc">cpc</option>
            <option value="cpm">cpm</option>
            <option value="email">email</option>
            <option value="push">push</option>
          </select>
          <select className="input" value={v.utmCampaign||''} onChange={(e)=> set('utmCampaign', e.target.value)}>
            <option value="">utm_campaign</option>
            <option value="black_friday">black_friday</option>
            <option value="ramadan">ramadan</option>
            <option value="launch">launch</option>
          </select>
          <select className="input" value={v.currency||''} onChange={(e)=> set('currency', e.target.value as any)}>
            <option value="">العملة (عرض فقط)</option>
            <option value="SAR">ر.س</option>
            <option value="AED">د.إ</option>
            <option value="USD">$</option>
          </select>
          <select className="input" value={v.page||''} onChange={(e)=> set('page', e.target.value as any)}>
            <option value="">كل الصفحات</option>
            <option value="home">الصفحة الرئيسية</option>
            <option value="product">صفحة المنتج</option>
            <option value="category">صفحة التصنيفات</option>
            <option value="cart">السلة</option>
            <option value="checkout">الدفع</option>
          </select>
          <select className="input" value={v.userSegment||'all'} onChange={(e)=> set('userSegment', e.target.value as any)}>
            <option value="all">كل المستخدمين</option>
            <option value="new_30d">جدد (30 يوم)</option>
            <option value="returning">عائدون</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      )}
      {onApply && <div><button className="btn btn-outline" onClick={onApply}>تطبيق</button></div>}
    </div>
  );
}


