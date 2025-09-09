"use client";
import React from "react";

export function HeroBanner(): JSX.Element {
  return (
    <section className="relative w-full h-56 md:h-72 bg-[#800020] text-white flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-wide">خصومات حتى 70%</h1>
        <p className="mt-2 opacity-90">عروض سريعة اليوم فقط</p>
        <a href="/search" className="inline-block mt-4 px-5 py-2 rounded-full bg-white text-[#800020] font-semibold">تسوق الآن</a>
      </div>
    </section>
  );
}

