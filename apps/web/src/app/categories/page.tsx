"use client";
import { trpc } from "../providers";
import Image from "next/image";

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
          <li key={c.id} className="group rounded overflow-hidden border hover:shadow-sm transition bg-white">
            <a href={`/search?categoryId=${c.id}`} className="block">
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                <Image src={c.image || "/placeholder-category.jpg"} alt={c.name} fill className="object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="p-3 flex items-center justify-between">
                <span className="font-medium truncate">{c.name}</span>
                <span className="opacity-0 group-hover:opacity-100 transition">→</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}