"use client";
import { trpc } from "./providers";
import { ProductCard } from "@repo/ui";

export default function Page(): JSX.Element {
  const query: any = (trpc as any);
  const { data, isLoading, error, fetchNextPage, hasNextPage } = query.products.list.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor }
  );

  if (isLoading) return <main className="p-8">Loading products...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const products = data?.pages.flatMap((p: any) => p.items) ?? [];

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Latest Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              rating: 0,
              reviewCount: 0,
            }}
            onViewDetails={(id) => (window.location.href = `/products/${id}`)}
          />
        ))}
      </div>
      {hasNextPage && (
        <div className="flex justify-center mt-8">
          <button onClick={() => fetchNextPage()} className="px-4 py-2 bg-black text-white rounded">
            Load More
          </button>
        </div>
      )}
    </main>
  );
}
