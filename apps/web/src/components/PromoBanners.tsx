"use client";
import React from "react";

export function PromoBanners(): JSX.Element {
  const banners = [
    { id: 1, text: "خصم 30% على الفساتين", img: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=800" },
    { id: 2, text: "أحذية رياضية جديدة", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
  ];
  return (
    <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {banners.map((b) => (
        <a key={b.id} href="/search" className="relative h-40 md:h-56 overflow-hidden rounded bg-gray-100">
          <img src={b.img} alt={b.text} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-3 right-3 text-white text-lg font-bold">{b.text}</div>
        </a>
      ))}
    </section>
  );
}

