"use client";
import { trpc } from "../providers";
import React from "react";
import { ProductCard } from "@repo/ui";
import { useI18n } from "../lib/i18n";

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
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">البحث</h1>
      {/* Filters */}
      <div className="mb-6">
        <div className="hidden md:grid grid-cols-1 md:grid-cols-6 gap-3">
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
          <button className="md:col-span-6 px-4 py-2 bg-black text-white rounded" onClick={() => refetch()}>تطبيق</button>
        </div>
        {/* Mobile filters: chips + simple dropdown */}
        <div className="md:hidden flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button className={`px-3 py-1.5 rounded-full border ${inStock ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setInStock(inStock ? undefined : true)}>متوفر</button>
            <button className={`px-3 py-1.5 rounded-full border ${inStock===false ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setInStock(inStock===false ? undefined : false)}>غير متوفر</button>
            <button className={`px-3 py-1.5 rounded-full border ${sortBy==='price' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setSortBy(sortBy==='price'? undefined : 'price')}>السعر</button>
          </div>
          <select className="border rounded px-3 py-2" onChange={(e) => setSortBy((e.target.value as any) || undefined)}>
            <option value="">الترتيب</option>
            <option value="createdAt">الأحدث</option>
            <option value="price">السعر</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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