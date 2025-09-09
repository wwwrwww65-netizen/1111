"use client";
import { trpc } from "../providers";
import React from "react";

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
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">سلة التسوق</h1>
      {!cart || cart.items.length === 0 ? (
        <p>السلة فارغة</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-4">
            {cart.items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between border p-4 rounded gap-4">
                <div className="flex-1">
                  <div className="font-semibold line-clamp-1">{item.product.name}</div>
                  <div className="text-sm text-gray-600">${item.product.price}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border rounded"
                    aria-label="decrease"
                    onClick={() => updateItem.mutate({ productId: item.productId, quantity: Math.max(0, item.quantity - 1) })}
                  >
                    -
                  </button>
                  <span className="min-w-[28px] text-center">{item.quantity}</span>
                  <button
                    className="px-2 py-1 border rounded"
                    aria-label="increase"
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
          </div>
          <aside className="border rounded p-4 h-fit sticky top-24">
            <div className="text-lg font-semibold mb-2">ملخص الطلب</div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>الإجمالي الفرعي</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>الشحن</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-base font-semibold mt-3">
              <span>الإجمالي</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <a href="/checkout" className="mt-4 block text-center px-4 py-2 bg-[#800020] text-white rounded">إتمام الشراء</a>
          </aside>
        </div>
      )}
      {/* Mobile sticky checkout */}
      {cart && cart.items.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white p-3 flex items-center justify-between">
          <div className="text-sm">الإجمالي: <b className="text-[#800020]">${subtotal.toFixed(2)}</b></div>
          <a href="/checkout" className="px-4 py-2 bg-[#800020] text-white rounded">إتمام</a>
        </div>
      )}
    </main>
  );
}