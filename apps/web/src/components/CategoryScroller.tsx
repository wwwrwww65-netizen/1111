"use client";
import React from "react";

type CategoryItem = { id: string; name: string; image?: string };

const defaultCategories: CategoryItem[] = [
  { id: "dresses", name: "فساتين" },
  { id: "tops", name: "بلايز" },
  { id: "pants", name: "سراويل" },
  { id: "shoes", name: "أحذية" },
  { id: "bags", name: "حقائب" },
  { id: "accessories", name: "إكسسوارات" },
  { id: "beauty", name: "جمال" },
  { id: "sports", name: "رياضة" },
];

export function CategoryScroller({
  categories = defaultCategories,
}: {
  categories?: CategoryItem[];
}): JSX.Element {
  return (
    <section className="mt-4 md:mt-6">
      <div className="flex items-center justify-between px-4 md:px-0">
        <h2 className="text-base md:text-xl font-bold">تسوق حسب التصنيف</h2>
        <a href="/categories" className="text-xs underline text-brand-accent hidden md:inline">الكل</a>
      </div>
      <div className="mt-3 overflow-x-auto no-scrollbar md:hidden">
        <ul className="flex gap-2 px-4">
          {categories.map((c) => (
            <li key={c.id}>
              <a
                href={`/search?cat=${c.id}`}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 bg-white text-[13px]"
              >
                {c.image ? (
                  <img src={c.image} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" />
                )}
                <span className="whitespace-nowrap">{c.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden md:block">
        <div className="grid grid-cols-6 gap-3 mt-3">
          {categories.slice(0, 12).map((c) => (
            <a key={c.id} href={`/search?cat=${c.id}`} className="group block border rounded-lg p-3 text-center text-sm hover:border-brand-accent">
              <div className="relative w-full h-24 overflow-hidden rounded bg-gray-100">
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="grid place-items-center w-full h-full text-brand-accent/60">{c.name.slice(0,2)}</div>
                )}
              </div>
              <div className="mt-2">{c.name}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

