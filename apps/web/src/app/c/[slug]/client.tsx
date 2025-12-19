"use client";
import { trpc } from "../../providers";
import React from "react";
import { ProductCard } from "@repo/ui";
import { useI18n } from "../../../lib/i18n";

export default function CategoryClientPage({ category }: { category: any }): JSX.Element {
    const { t } = useI18n();
    const q: any = trpc as any;
    // Initialize state with categoryId
    const [query, setQuery] = React.useState<string | undefined>(undefined);
    const [minPrice, setMinPrice] = React.useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = React.useState<number | undefined>(undefined);
    const [inStock, setInStock] = React.useState<boolean | undefined>(undefined);
    const [sortBy, setSortBy] = React.useState<'name' | 'price' | 'rating' | 'createdAt' | undefined>(undefined);
    const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc' | undefined>(undefined);

    const { data, isLoading, error, refetch } = q.search.searchProducts.useQuery({
        categoryId: category.id,
        query,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        sortOrder,
        page: 1,
        limit: 20,
    });

    if (isLoading) return <main className="p-8">Loading products...</main>;
    if (error) return <main className="p-8">Error: {(error as any).message}</main>;

    const products = data?.products ?? [];

    return (
        <main className="min-h-screen p-0 md:p-8 max-w-7xl mx-auto">
            <div className="md:block hidden mb-6">
                <h1 className="text-3xl font-bold">{category.seo?.seoTitle || category.name}</h1>
                {category.seo?.seoDescription && <p className="text-gray-600 mt-2">{category.seo.seoDescription}</p>}
            </div>

            {/* Mobile Header with Title */}
            <div className="md:hidden px-4 py-3 border-b bg-white sticky top-0 z-30">
                <h1 className="text-lg font-bold">{category.name}</h1>
                <div className="text-xs text-gray-500">{products.length} منتج</div>
            </div>

            {/* Filters (Simplified from SearchPage) */}
            <div className="mb-6 px-4 md:px-0">
                <div className="flex flex-wrap gap-3">
                    <input className="border rounded px-3 py-2 text-sm" placeholder="ابحث في الفئة..." value={query || ''} onChange={(e) => setQuery(e.target.value || undefined)} />
                    <select className="border rounded px-3 py-2 text-sm" onChange={(e) => setSortBy((e.target.value as any) || undefined)}>
                        <option value="">الترتيب</option>
                        <option value="createdAt">الأحدث</option>
                        <option value="price">السعر</option>
                    </select>
                    <button className="px-4 py-2 bg-[#800020] text-white rounded text-sm" onClick={() => refetch()}>تطبيق</button>
                </div>
            </div>

            <div className="px-4 md:px-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mt-4">
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
                            rating: p.rating || 0,
                            reviewCount: p.reviewCount || 0,
                        }}
                        onViewDetails={(id) => (window.location.href = `/p/${(p as any).slug || (p.seo as any)?.slug || id}`)}
                    />
                ))}
                {products.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">لا توجد منتجات في هذه الفئة حالياً.</div>
                )}
            </div>
        </main>
    );
}
