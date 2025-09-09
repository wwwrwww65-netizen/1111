"use client";
import { trpc } from "../providers";

export default function AccountPage(): JSX.Element {
  const q: any = trpc as any;
  const me = q.auth.me.useQuery();
  const orders = q.orders.listOrders.useQuery();

  if (me.isLoading || orders.isLoading) return <main className="p-8">Loading...</main>;
  if (me.error) return <main className="p-8">Error: {(me.error as any).message}</main>;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">حسابي</h1>
      <div className="mb-6">
        <div className="text-sm text-gray-700">الاسم: <b className="text-[#800020]">{me.data?.name}</b></div>
        <div className="text-sm text-gray-700">البريد: <b>{me.data?.email}</b></div>
      </div>
      <h2 className="text-xl font-semibold mb-2">طلباتي</h2>
      <div className="space-y-3">
        {(orders.data?.orders ?? []).map((o: any) => (
          <div key={o.id} className="border p-4 rounded">
            <div>رقم الطلب: {o.id}</div>
            <div>الإجمالي: <b className="text-[#800020]">${o.total}</b></div>
            <div>الحالة: {o.status}</div>
          </div>
        ))}
      </div>
    </main>
  );
}