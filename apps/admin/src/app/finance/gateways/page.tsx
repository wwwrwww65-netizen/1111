"use client";
import React from 'react';

export default function PaymentGatewaysPage(): JSX.Element {
  return (
    <div className="panel">
      <h1 className="text-xl font-bold mb-3">بوابات الدفع وسجلاتها</h1>
      <div className="toolbar">
        <select className="select"><option>بوابة: الكل</option><option>Stripe</option><option>PayPal</option></select>
        <button className="btn btn-sm">تصالح (Reconcile)</button>
      </div>
      <div className="mt-3">
        <table className="table">
          <thead><tr><th>الوقت</th><th>البوابة</th><th>المبلغ</th><th>الرسوم</th><th>الحالة</th></tr></thead>
          <tbody>
            <tr><td>2025-09-09 10:31</td><td>Stripe</td><td>$120.00</td><td>$3.60</td><td><span className="badge ok">تم التحصيل</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

