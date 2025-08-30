"use client";
import { trpc } from "../providers";
import React from "react";

export default function CheckoutPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.cart.getCart.useQuery();
  const createOrder = q.orders.createOrder.useMutation();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">الدفع</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <section className="md:col-span-2 space-y-4">
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">بيانات الشحن</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="الاسم الكامل" className="border rounded px-3 py-2" />
              <input placeholder="الهاتف" className="border rounded px-3 py-2" />
              <input placeholder="المدينة" className="border rounded px-3 py-2" />
              <input placeholder="الحي" className="border rounded px-3 py-2" />
              <input placeholder="الشارع" className="border rounded px-3 py-2 md:col-span-2" />
            </div>
          </div>
          <div className="border rounded p-4">
            <div className="font-semibold mb-2">طريقة الدفع</div>
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="pm" defaultChecked/> بطاقة</label>
              <label className="flex items-center gap-2"><input type="radio" name="pm"/> Apple Pay</label>
              <label className="flex items-center gap-2"><input type="radio" name="pm"/> عند الاستلام</label>
            </div>
          </div>
        </section>
        <aside className="border rounded p-4 h-fit">
          <div className="text-lg font-semibold mb-2">ملخص</div>
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
          <button
            className="mt-4 w-full px-4 py-2 bg-black text-white rounded"
            onClick={async () => {
              await createOrder.mutateAsync({});
              window.location.href = "/account";
            }}
          >
            تأكيد الطلب
          </button>
        </aside>
      </div>
      {/* Mobile sticky confirm */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white p-3 flex items-center justify-between">
        <div className="text-sm">الإجمالي: <b>${subtotal.toFixed(2)}</b></div>
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={async () => {
            await createOrder.mutateAsync({});
            window.location.href = "/account";
          }}
        >
          تأكيد
        </button>
      </div>
    </main>
  );
}