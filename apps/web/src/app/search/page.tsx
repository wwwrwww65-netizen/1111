"use client";
import { trpc } from "../providers";
import React from "react";

export default function SearchPage(): JSX.Element {
  const q: any = trpc as any;
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
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
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">البحث</h1>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-3">
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

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="border rounded p-4">
            <a href={`/products/${p.id}`}>{p.name}</a>
          </div>
        ))}
      </div>
    </main>
  );
}