"use client";
import { trpc } from "./providers";
import { ProductCard } from "@repo/ui";
import React from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { PromoBar } from "../components/PromoBar";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryGrid } from "../components/CategoryGrid";
import { CategoryScroller } from "../components/CategoryScroller";
import { SectionGrid } from "../components/SectionGrid";
import { PromoBanners } from "../components/PromoBanners";
import { TabsSection } from "../components/TabsSection";
import { Recommendations } from "../components/Recommendations";
import { FooterCompact } from "../components/FooterCompact";
import { SkeletonCard } from "../components/SkeletonCard";
import { HtmlLangDir } from "../lib/i18n";

export default function HomeClient(): JSX.Element {
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
                const res = await fetch('/api/products', { cache: 'no-store' });
                if (!aborted && res.ok) {
                    const json = await res.json();
                    const items = json?.items || [];
                    if (items.length) setFallbackProducts(items);
                }
            } catch { }
        };
        fetchFallback();
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
            <HtmlLangDir />
            <PromoBar />
            <HeroBanner />
            <CategoryScroller />
            <div className="hidden md:block">
                <CategoryGrid />
            </div>

            <section className="mt-6" id="new-arrivals">
                <div className="flex items-center justify-between px-4 md:px-0">
                    <h2 className="text-xl md:text-2xl font-bold relative after:content-[''] after:block after:w-10 after:h-0.5 after:bg-[#800020] after:mt-1">وصل حديثاً</h2>
                    {hasNextPage && (
                        <button
                            onClick={() => fetchNextPage()}
                            className="text-sm px-3 py-1.5 rounded-full border border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
                        >
                            المزيد
                        </button>
                    )}
                </div>
                <div className="mt-4 px-4 md:px-0 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
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
                                onViewDetails={(id) => (window.location.href = `/p/${(p as any).slug || (p.seo as any)?.slug || id}`)}
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
