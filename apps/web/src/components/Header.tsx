"use client";
import React from "react";

export function Header(): JSX.Element {
  const [q, setQ] = React.useState("");
  return (
    <header className="sticky top-0 z-40 bg-brand-accent text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="/" className="text-xl font-extrabold tracking-wide">Jeeey</a>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <a href="/categories" className="hover:opacity-90">التصنيفات</a>
          <a href="/search" className="hover:opacity-90">البحث</a>
          <a href="/account" className="hover:opacity-90">حسابي</a>
        </nav>
        <div className="flex-1" />
        <form
          className="hidden md:flex items-center gap-2 w-[340px] rounded px-3 py-1.5 bg-white text-brand"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = `/search?q=${encodeURIComponent(q)}`;
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن منتجات..."
            className="w-full outline-none text-sm text-brand"
          />
          <button type="submit" className="text-sm px-2 py-1 bg-brand-accent text-white rounded">بحث</button>
        </form>
        <div className="flex items-center gap-3">
          <a href="/cart" aria-label="Cart" className="relative px-2 py-1 rounded hover:bg-white/10">
            🛒
          </a>
          <a href="/account" aria-label="Account" className="px-2 py-1 rounded hover:bg-white/10">
            👤
          </a>
        </div>
      </div>
    </header>
  );
}

