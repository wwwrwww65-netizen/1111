"use client";
import React from "react";

export function MobileBottomNav(): JSX.Element {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t bg-white">
      <div className="grid grid-cols-4 text-center text-xs">
        <a href="/" className="py-3">
          الرئيسية
        </a>
        <a href="/categories" className="py-3">
          التصنيفات
        </a>
        <a href="/search" className="py-3">
          البحث
        </a>
        <a href="/account" className="py-3">
          حسابي
        </a>
      </div>
    </nav>
  );
}

