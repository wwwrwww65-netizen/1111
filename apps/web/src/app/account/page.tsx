"use client";
import { trpc } from "../providers";

export default function AccountPage(): JSX.Element {
  const q: any = trpc as any;
  const me = q.auth.me.useQuery();
  const orders = q.orders.listOrders.useQuery();

  if (me.isLoading || orders.isLoading) return <main className="p-8">Loading...</main>;
  if (me.error) return <main className="p-8">Error: {(me.error as any).message}</main>;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">حسابي</h1>
      <div className="mb-6">
        <div>الاسم: {me.data?.name}</div>
        <div>البريد: {me.data?.email}</div>
      </div>
      <h2 className="text-xl font-semibold mb-2">طلباتي</h2>
      <div className="space-y-3">
        {(orders.data?.orders ?? []).map((o: any) => (
          <div key={o.id} className="border p-4 rounded">
            <div>رقم الطلب: {o.id}</div>
            <div>الإجمالي: ${o.total}</div>
            <div>الحالة: {o.status}</div>
          </div>
        ))}
      </div>
    </main>
  );
}