"use client";
import { trpc } from "./providers";
import { ProductCard } from "@repo/ui";

export default function Page(): JSX.Element {
  const query: any = (trpc as any);
  const now = new Date();
  const { data, isLoading, error, fetchNextPage, hasNextPage } = query.products.list.useInfiniteQuery(
    { limit: 12 },
    { getNextPageParam: (lastPage: any) => lastPage.nextCursor }
  );

  const [fallbackProducts, setFallbackProducts] = React.useState<any[] | null>(null as any);
  React.useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setTimeout(async () => {
        try {
          const url = 'https://jeeeyai.onrender.com/trpc/products.list?input=' + encodeURIComponent(JSON.stringify({ limit: 12 }));
          const res = await fetch(url, { credentials: 'include' });
          if (res.ok) {
            const json = await res.json();
            const items = json?.result?.data?.items || [];
            if (items.length) setFallbackProducts(items);
          }
        } catch {}
      }, 1500);
    }
    return () => timer && clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !fallbackProducts) return <main className="p-8">Loading products...</main>;
  if (error && !fallbackProducts) return <main className="p-8">Error: {(error as any).message}</main>;

  const products = fallbackProducts ?? (data?.pages.flatMap((p: any) => p.items) ?? []);

  return (
    <main className="min-h-screen p-0 md:p-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <section className="relative w-full h-56 md:h-80 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl md:text-4xl font-bold">عروض اليوم</h1>
          <p className="mt-2 md:mt-3 opacity-90">خصومات حصرية على أفضل المنتجات لفترة محدودة</p>
        </div>
      </section>

      {/* Figma Embed Preview */}
      <section className="p-4 md:p-6">
        <div className="w-full flex justify-center">
          <iframe
            style={{ border: '1px solid rgba(0, 0, 0, 0.1)' }}
            width={800}
            height={450}
            src="https://embed.figma.com/design/iBFo5QZCthBkGD7xoZgcVm/shein--Community-?node-id=0-1&embed-host=share"
            allowFullScreen
          />
        </div>
      </section>

      {/* Sections */}
      <section className="p-6 md:p-0 md:mt-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">الأحدث</h2>
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
      </section>

      {/* Best Sellers placeholder */}
      <section className="p-6 md:p-0 md:mt-10">
        <h2 className="text-xl md:text-2xl font-bold mb-4">الأكثر مبيعاً</h2>
        <div className="text-gray-600">سيتم ملؤها بمنتجات شائعة قريباً.</div>
      </section>

      {/* Limited Offers placeholder */}
      <section className="p-6 md:p-0 md:mt-10">
        <h2 className="text-xl md:text-2xl font-bold mb-4">عروض محدودة</h2>
        <div className="text-gray-600">تابعونا لعروض فلاش قريبة.</div>
      </section>
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
