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
    <main className="min-h-screen p-0">
      {/* Hero */}
      <section className="relative w-full h-40 md:h-52 bg-[#800020] text-white flex items-center">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">التصنيفات</h1>
          <p className="opacity-90 text-sm md:text-base mt-1">اكتشف تشكيلاتنا حسب التصنيف</p>
        </div>
      </section>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {categories.map((c: any) => (
            <li key={c.id} className="group rounded-lg overflow-hidden border bg-white">
              <a href={`/c/${c.slug || c.id}`} className="block">
                <div className="relative w-full aspect-[3/4] bg-gray-100">
                  {/* Use plain img to avoid next/image optimizer when running standalone */}
                  <img src={c.image || "/images/placeholder-category.jpg"} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium truncate text-gray-900">{c.name}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#800020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition"><path d="M9 18l6-6-6-6" /></svg>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}