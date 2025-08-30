"use client";
import React from "react";

const demoCategories = [
  { id: "dresses", name: "فساتين", image: "https://images.unsplash.com/photo-1541781286675-7b99f4efcb84?w=400" },
  { id: "shoes", name: "أحذية", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400" },
  { id: "bags", name: "حقائب", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400" },
  { id: "accessories", name: "إكسسوارات", image: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=400" },
  { id: "beauty", name: "جمال", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400" },
  { id: "sports", name: "رياضة", image: "https://images.unsplash.com/photo-1521417531291-6ee0b0b44d5f?w=400" },
];

export function CategoryGrid(): JSX.Element {
  return (
    <section className="mt-6">
      <h2 className="text-xl md:text-2xl font-bold mb-3">تسوق حسب التصنيف</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {demoCategories.map((c) => (
          <a key={c.id} href={`/search?cat=${c.id}`} className="group block">
            <div className="relative w-full h-28 overflow-hidden rounded bg-gray-100">
              <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="mt-2 text-center text-sm">{c.name}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

