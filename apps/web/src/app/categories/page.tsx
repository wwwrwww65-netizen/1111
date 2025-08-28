"use client";
import { trpc } from "../providers";

export default function CategoriesPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.search.getSearchFilters.useQuery();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const categories = data?.categories ?? [];

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">التصنيفات</h1>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((c: any) => (
          <li key={c.id} className="border rounded p-4">
            <a href={`/search?categoryId=${c.id}`}>{c.name}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}