"use client";
import { trpc } from "./providers";
import { ProductCard } from "@repo/ui";
import React from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PromoBar } from "../components/PromoBar";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { SectionGrid } from "../components/SectionGrid";
import { PromoBanners } from "../components/PromoBanners";
import { TabsSection } from "../components/TabsSection";
import { Recommendations } from "../components/Recommendations";
import { FooterCompact } from "../components/FooterCompact";
import { SkeletonCard } from "../components/SkeletonCard";

export default function Page(): JSX.Element {
  const query: any = (trpc as any);
  const now = new Date();
  const { data, isLoading, error, fetchNextPage, hasNextPage } = query.products.list.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor }
  );

  const [fallbackProducts, setFallbackProducts] = React.useState<any[] | null>(null as any);
  React.useEffect(() => {
    let aborted = false;
    const fetchFallback = async () => {
      try {
        const url = 'https://jeeeyai.onrender.com/trpc/products.list?input=' + encodeURIComponent(JSON.stringify({ limit: 12 }));
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (!aborted && res.ok) {
          const json = await res.json();
          const items = json?.result?.data?.items || [];
          if (items.length) setFallbackProducts(items);
        }
      } catch {}
    };
    // Trigger immediately on mount
    fetchFallback();
    // Also retrigger if still loading after a short delay
    const timer = setTimeout(() => { if (!fallbackProducts) fetchFallback(); }, 1200);
    return () => { aborted = true; clearTimeout(timer); };
  }, []);

  if (isLoading && !fallbackProducts) return <>
    <main className="p-8">Loading products...</main>
    <LoadingOverlay />
  </>;
  if (error && !fallbackProducts) return <main className="p-8">Error: {(error as any).message}</main>;

  const products = fallbackProducts ?? (data?.pages.flatMap((p: any) => p.items) ?? []);

  return (
    <main className="min-h-screen p-0 md:p-6 max-w-7xl mx-auto">
      <PromoBar />
      <HeroBanner />
      <CategoryGrid />

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold">وصل حديثاً</h2>
          {hasNextPage && (
            <button onClick={() => fetchNextPage()} className="text-sm underline">المزيد</button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(!products?.length ? Array.from({ length: 10 }) : products).map((p: any, idx: number) => (
            !products?.length ? (
              <SkeletonCard key={idx} />
            ) : (
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
            )
          ))}
        </div>
      </section>

      <PromoBanners />

      {!!products?.length && (
        <>
          <TabsSection
            newArrivals={products.slice(0, 10)}
            bestSellers={products.slice(5, 15)}
            recommended={products.slice(2, 12)}
          />
          <Recommendations products={products.slice(0, 12)} />
          <SectionGrid title="الأكثر مبيعاً" products={products.slice(0, 10)} />
        </>
      )}

      <FooterCompact />
    </main>
  );
}
