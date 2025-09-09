"use client";
import { trpc } from "../providers";
import React from "react";
import { ProductCard } from "@repo/ui";
import { useI18n } from "../../lib/i18n";

export default function SearchPage(): JSX.Element {
  const { t } = useI18n();
  const q: any = trpc as any;
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialCategoryId = params.get("categoryId") || undefined;
  const initialQuery = params.get("q") || undefined;

  const [query, setQuery] = React.useState<string | undefined>(initialQuery);
  const [categoryId, setCategoryId] = React.useState<string | undefined>(initialCategoryId);
  const [minPrice, setMinPrice] = React.useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = React.useState<number | undefined>(undefined);
  const [inStock, setInStock] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<'name'|'price'|'rating'|'createdAt'|undefined>(undefined);
  const [sortOrder, setSortOrder] = React.useState<'asc'|'desc'|undefined>(undefined);

  const { data, isLoading, error, refetch } = q.search.searchProducts.useQuery({
    categoryId,
    query,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder,
    page: 1,
    limit: 20,
  });

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const products = data?.products ?? [];

  return (
    <main className="min-h-screen p-0 md:p-8 max-w-7xl mx-auto">
      {/* Sticky mobile filter bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-base font-bold">البحث</div>
          <div className="text-xs text-gray-500">{products.length} منتج</div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button className={`px-3 py-1.5 rounded-full border ${inStock ? 'border-[#800020] text-[#800020] bg-white' : 'border-gray-200 bg-white text-gray-800'}`} onClick={() => setInStock(inStock ? undefined : true)}>متوفر</button>
            <button className={`px-3 py-1.5 rounded-full border ${inStock===false ? 'border-[#800020] text-[#800020] bg-white' : 'border-gray-200 bg-white text-gray-800'}`} onClick={() => setInStock(inStock===false ? undefined : false)}>غير متوفر</button>
            <button className={`px-3 py-1.5 rounded-full border ${sortBy==='price' ? 'border-[#800020] text-[#800020] bg-white' : 'border-gray-200 bg-white text-gray-800'}`} onClick={() => setSortBy(sortBy==='price'? undefined : 'price')}>السعر</button>
            <select className="px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-800" onChange={(e) => setSortBy((e.target.value as any) || undefined)}>
              <option value="">الترتيب</option>
              <option value="createdAt">الأحدث</option>
              <option value="price">السعر</option>
            </select>
          </div>
        </div>
      </div>
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold mb-4 px-1">البحث</h1>
      </div>
      {/* Filters */}
      <div className="mb-6 hidden md:block px-1">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="border rounded px-3 py-2" placeholder="ابحث..." value={query || ''} onChange={(e) => setQuery(e.target.value || undefined)} />
          <input className="border rounded px-3 py-2" placeholder="السعر الأدنى" type="number" onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)} />
          <input className="border rounded px-3 py-2" placeholder="السعر الأعلى" type="number" onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)} />
          <select className="border rounded px-3 py-2" onChange={(e) => setInStock(e.target.value === '' ? undefined : e.target.value === 'in')}>
            <option value="">التوفر</option>
            <option value="in">متوفر</option>
            <option value="out">غير متوفر</option>
          </select>
          <select className="border rounded px-3 py-2" onChange={(e) => setSortBy((e.target.value as any) || undefined)}>
            <option value="">الترتيب</option>
            <option value="createdAt">الأحدث</option>
            <option value="name">الاسم</option>
            <option value="price">السعر</option>
            <option value="rating">التقييم</option>
          </select>
          <select className="border rounded px-3 py-2" onChange={(e) => setSortOrder((e.target.value as any) || undefined)}>
            <option value="">اتجاه</option>
            <option value="asc">تصاعدي</option>
            <option value="desc">تنازلي</option>
          </select>
          <button className="md:col-span-6 px-4 py-2 bg-[#800020] text-white rounded" onClick={() => refetch()}>تطبيق</button>
        </div>
      </div>

      {/* Results */}
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
            onViewDetails={(id) => (window.location.href = `/products/${id}`)}
          />
        ))}
      </div>
    </main>
  );
}