"use client";
import { trpc } from "../providers";

export default function CartPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error, refetch } = q.cart.getCart.useQuery();
  const updateItem = q.cart.updateItem.useMutation({ onSuccess: () => refetch() });
  const removeItem = q.cart.removeItem.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <main className="p-8">Loading cart...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const cart = data?.cart;
  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">سلة التسوق</h1>
      {!cart || cart.items.length === 0 ? (
        <p>السلة فارغة</p>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between border p-4 rounded">
              <div>
                <div className="font-semibold">{item.product.name}</div>
                <div className="text-sm text-gray-600">${item.product.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateItem.mutate({ productId: item.productId, quantity: Math.max(0, item.quantity - 1) })}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                >
                  +
                </button>
                <button
                  className="ml-2 px-3 py-1 border rounded"
                  onClick={() => removeItem.mutate({ productId: item.productId })}
                >
                  إزالة
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-lg">الإجمالي الفرعي: ${subtotal.toFixed(2)}</div>
            <a href="/checkout" className="px-4 py-2 bg-black text-white rounded">إتمام الشراء</a>
          </div>
        </div>
      )}
    </main>
  );
}

<<<<<<< HEAD
"use client";
import { trpc } from "../providers";

export default function CartPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error, refetch } = q.cart.getCart.useQuery();
  const updateItem = q.cart.updateItem.useMutation({ onSuccess: () => refetch() });
  const removeItem = q.cart.removeItem.useMutation({ onSuccess: () => refetch() });

  if (isLoading) return <main className="p-8">Loading cart...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const cart = data?.cart;
  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">سلة التسوق</h1>
      {!cart || cart.items.length === 0 ? (
        <p>السلة فارغة</p>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between border p-4 rounded">
              <div>
                <div className="font-semibold">{item.product.name}</div>
                <div className="text-sm text-gray-600">${item.product.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateItem.mutate({ productId: item.productId, quantity: Math.max(0, item.quantity - 1) })}
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                >
                  +
                </button>
                <button
                  className="ml-2 px-3 py-1 border rounded"
                  onClick={() => removeItem.mutate({ productId: item.productId })}
                >
                  إزالة
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-lg">الإجمالي الفرعي: ${subtotal.toFixed(2)}</div>
            <a href="/checkout" className="px-4 py-2 bg-black text-white rounded">إتمام الشراء</a>
          </div>
        </div>
      )}
=======
export default function CartPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Cart</h1>
      <p>Your shopping cart is empty.</p>
>>>>>>> origin/main
    </main>
  );
}