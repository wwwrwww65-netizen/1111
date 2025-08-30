"use client";
import React from "react";

export function FooterCompact(): JSX.Element {
  return (
    <footer className="mt-12 border-t pt-6 pb-10 text-sm text-gray-600">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="font-bold mb-2">خدمة العملاء</div>
          <ul className="space-y-1">
            <li><a href="#">مساعدة</a></li>
            <li><a href="#">الإرجاع والاستبدال</a></li>
            <li><a href="#">الشحن والتسليم</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">عن المتجر</div>
          <ul className="space-y-1">
            <li><a href="#">من نحن</a></li>
            <li><a href="#">سياسة الخصوصية</a></li>
            <li><a href="#">الشروط والأحكام</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">تواصل</div>
          <ul className="space-y-1">
            <li><a href="#">اتصل بنا</a></li>
            <li><a href="#">البريد</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-2">المدفوعات</div>
          <div className="text-xs">بطاقات، مدى، Apple Pay</div>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Jeeey</div>
    </footer>
  );
}

