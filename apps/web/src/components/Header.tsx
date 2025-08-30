"use client";
import React from "react";

export function Header(): JSX.Element {
  const [q, setQ] = React.useState("");
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="/" className="text-xl font-extrabold tracking-wide">Jeeey</a>
        <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700">
          <a href="/categories" className="hover:text-black">التصنيفات</a>
          <a href="/search" className="hover:text-black">البحث</a>
          <a href="/account" className="hover:text-black">حسابي</a>
        </nav>
        <div className="flex-1" />
        <form
          className="hidden md:flex items-center gap-2 w-[340px] border rounded px-3 py-1.5 bg-white"
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
          <button type="submit" className="text-sm px-2 py-1 bg-black text-white rounded">بحث</button>
        </form>
        <div className="flex items-center gap-3">
          <a href="/cart" aria-label="Cart" className="relative px-2 py-1 rounded hover:bg-gray-100">
            🛒
          </a>
          <a href="/account" aria-label="Account" className="px-2 py-1 rounded hover:bg-gray-100">
            👤
          </a>
        </div>
      </div>
    </header>
  );
}

