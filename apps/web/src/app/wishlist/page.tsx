"use client";
import { trpc } from "../providers";

export default function WishlistPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error, refetch } = q.wishlist.getWishlist.useQuery();
  const remove = q.wishlist.removeFromWishlist.useMutation({ onSuccess: () => refetch() });
  const move = q.wishlist.moveToCart.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const items = data?.wishlistItems ?? [];
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">المفضلة</h1>
      {items.length === 0 ? (
        <div className="text-center text-gray-600">
          <div className="text-lg mb-2">لا توجد عناصر في المفضلة</div>
          <a href="/" className="inline-block mt-1 px-4 py-2 bg-[#800020] text-white rounded">ابدأ التسوق</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it: any) => (
            <div key={it.id} className="border rounded p-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold line-clamp-1">{it.product.name}</div>
                <div className="text-sm text-[#800020] font-semibold">${it.product.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white" onClick={() => move.mutate({ productId: it.productId, quantity: 1 })}>إلى السلة</button>
                <button className="px-3 py-1 border rounded" onClick={() => remove.mutate({ productId: it.productId })}>إزالة</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

