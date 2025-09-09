"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "../lib/i18n";

export function MobileBottomNav(): JSX.Element {
  const pathname = usePathname();
  const { t } = useI18n();

  const items = [
    {
      href: "/",
      label: t("home"),
      isActive: pathname === "/",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 11l9-8 9 8"/>
          <path d="M9 21V9h6v12"/>
        </svg>
      ),
    },
    {
      href: "/categories",
      label: t("categories"),
      isActive: pathname?.startsWith("/categories") ?? false,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      href: "/search",
      label: t("search"),
      isActive: pathname?.startsWith("/search") ?? false,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      href: "/wishlist",
      label: t("wishlist") || "المفضلة",
      isActive: pathname?.startsWith("/wishlist") ?? false,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 22l8.8-10.3a5 5 0 0 0 0-7.1z"/>
        </svg>
      ),
    },
    {
      href: "/cart",
      label: t("cart"),
      isActive: pathname?.startsWith("/cart") ?? false,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L21 6H6"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
      <div className="border-t bg-white px-1">
        <ul className="grid grid-cols-5 text-center text-[11px] leading-tight">
          {items.map((it) => (
            <li key={it.href}>
              <a
                href={it.href}
                aria-current={it.isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${it.isActive ? "text-[#800020]" : "text-gray-700"}`}
              >
                <span className={`grid place-items-center w-6 h-6 mb-0.5`}>{it.icon}</span>
                <span className={`whitespace-nowrap`}>{it.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

