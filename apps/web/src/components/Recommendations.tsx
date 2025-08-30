"use client";
import React from "react";
import { ProductCard } from "@repo/ui";

interface RecommendationsProps {
  products: Array<any>;
}

export function Recommendations({ products }: RecommendationsProps): JSX.Element {
  return (
    <section className="mt-10">
      <h2 className="text-xl md:text-2xl font-bold mb-3">عناصر قد تعجبك</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((p: any) => (
          <div key={p.id} className="min-w-[160px] max-w-[160px]">
            <ProductCard
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
              onViewDetails={(id) => (window.location.href = `/products/${id}`)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

