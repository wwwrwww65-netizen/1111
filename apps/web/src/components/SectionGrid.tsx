"use client";
import React from "react";
import { ProductCard } from "@repo/ui";

interface SectionGridProps {
  title: string;
  products: Array<any>;
}

export function SectionGrid({ title, products }: SectionGridProps): JSX.Element {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((p: any) => (
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
            onViewDetails={(id) => (window.location.href = `/products/${id}`)}
          />
        ))}
      </div>
    </section>
  );
}

