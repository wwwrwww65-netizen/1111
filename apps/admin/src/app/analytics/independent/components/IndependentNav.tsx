"use client";
import React from "react";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/analytics/independent", label: "نظرة عامة" },
  { href: "/analytics/independent/realtime", label: "الزمن الحقيقي" },
  { href: "/analytics/independent/visitors", label: "الزائر" },
  { href: "/analytics/independent/users", label: "المستخدم" },
  { href: "/analytics/independent/pages", label: "الصفحات" },
  { href: "/analytics/independent/referrers", label: "المُحيلون" },
  { href: "/analytics/independent/geo", label: "الجغرافيا" },
  { href: "/analytics/independent/devices", label: "الأجهزة" },
  { href: "/analytics/independent/campaigns", label: "الحملات UTM" },
  { href: "/analytics/independent/clicks", label: "النقرات" },
  { href: "/analytics/independent/forms", label: "النماذج" },
  { href: "/analytics/independent/ecommerce", label: "التجارة" },
];

export function IndependentNav(): JSX.Element {
  const pathname = usePathname() || "/analytics/independent";
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
      {tabs.map(t=> {
        const active = pathname === t.href;
        return (
          <a key={t.href} href={t.href}
             className={`btn ${active? "" : "btn-outline"}`}
             style={{ minHeight:36, padding:"0 12px" }}>{t.label}</a>
        );
      })}
    </div>
  );
}


