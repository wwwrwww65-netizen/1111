"use client";
import { trpc } from "../providers";

export default function CategoriesPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.search.getSearchFilters.useQuery();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const categories = data?.categories ?? [];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">التصنيفات</h1>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((c: any) => (
          <li key={c.id} className="group border rounded p-4 hover:shadow-sm transition">
            <a href={`/search?categoryId=${c.id}`} className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{c.name}</span>
              <span className="opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}