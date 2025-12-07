"use client";
import React from "react";
import { ProductCard } from "@repo/ui";

interface TabsSectionProps {
  newArrivals: Array<any>;
  bestSellers: Array<any>;
  recommended: Array<any>;
}

const tabs = [
  { id: "new", label: "الأحدث" },
  { id: "best", label: "الأكثر مبيعاً" },
  { id: "rec", label: "مقترحة لك" },
];

export function TabsSection({ newArrivals, bestSellers, recommended }: TabsSectionProps): JSX.Element {
  const [active, setActive] = React.useState<string>("new");

  const list = active === "new" ? newArrivals : active === "best" ? bestSellers : recommended;

  return (
    <section className="mt-10">
      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={
              "px-3 py-2 text-sm md:text-base rounded-t-md transition-colors " +
              (active === t.id
                ? " font-bold border-b-2 border-[#800020] text-[#800020]"
                : " text-gray-600 hover:text-gray-800")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {list.map((p: any) => (
          <ProductCard
            key={p.id}
            product={{
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              images: p.images,
              stock: p.stockQuantity,
              rating: 0,
              reviewCount: 0,
            }}
            onViewDetails={(id) => (window.location.href = `/p/${id}`)}
          />
        ))}
      </div>
    </section>
  );
}

