<<<<<<< HEAD
"use client";
import { trpc } from "../providers";

export default function SearchPage(): JSX.Element {
  const q: any = trpc as any;
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const categoryId = params.get("categoryId") || undefined;
  const query = params.get("q") || undefined;
  const { data, isLoading, error } = q.search.searchProducts.useQuery({ categoryId, query, page: 1, limit: 20 });

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const products = data?.products ?? [];

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">البحث</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="border rounded p-4">
            <a href={`/products/${p.id}`}>{p.name}</a>
          </div>
        ))}
      </div>
=======
export default function SearchPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Search</h1>
      <p>Find products by name, category, or tags.</p>
>>>>>>> origin/main
    </main>
  );
}