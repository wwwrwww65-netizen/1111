"use client";
import React from "react";
import { useI18n } from "../lib/i18n";

export function Header(): JSX.Element {
  const { locale, setLocale, t } = useI18n();
  const [q, setQ] = React.useState("");
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top row (mobile) */}
        <div className="flex items-center justify-between py-3 md:hidden">
          <a href="/search" aria-label="Search" className="p-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </a>
          <a href="/" className="text-xl font-extrabold tracking-wide">Jeeey</a>
          <div className="flex items-center gap-1">
            <a href="/cart" aria-label="Cart" className="p-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L21 6H6"/></svg>
            </a>
            <a href="/account" aria-label="Account" className="p-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
          </div>
        </div>
        {/* Desktop row */}
        <div className="hidden md:grid grid-cols-12 items-center py-3 gap-4">
          <nav className="col-span-4 flex items-center gap-4 text-sm">
            <a href="/categories" className="hover:text-brand-accent">{t('categories')}</a>
            <a href="/search" className="hover:text-brand-accent">{t('search')}</a>
            <a href="/account" className="hover:text-brand-accent">{t('account')}</a>
          </nav>
          <div className="col-span-4 flex justify-center">
            <a href="/" className="text-2xl font-extrabold tracking-wide">Jeeey</a>
          </div>
          <div className="col-span-4 flex items-center justify-end gap-3">
            <form
              className="hidden md:flex items-center gap-2 w-[360px] rounded-full px-3 py-1.5 border bg-white"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/search?q=${encodeURIComponent(q)}`;
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث عن منتجات..."
                className="w-full outline-none text-sm"
              />
              <button type="submit" className="text-sm px-3 py-1.5 bg-brand-accent text-white rounded-full">بحث</button>
            </form>
            <a href="/cart" aria-label="Cart" className="p-2 hover:text-brand-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L21 6H6"/></svg>
            </a>
            <a href="/account" aria-label="Account" className="p-2 hover:text-brand-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
            <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} className="text-xs px-2 py-1 border rounded">
              {locale === 'ar' ? 'EN' : 'AR'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

