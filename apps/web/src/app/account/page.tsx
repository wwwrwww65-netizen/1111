"use client";
import { trpc } from "../providers";

export default function AccountPage(): JSX.Element {
  const q: any = trpc as any;
  const me = q.auth.me.useQuery();
  const orders = q.orders.listOrders.useQuery();

  if (me.isLoading || orders.isLoading) return <main className="p-8">Loading...</main>;
  if (me.error) return <main className="p-8">Error: {(me.error as any).message}</main>;

  if (!me.data) {
    return (
      <main className="min-h-screen p-8 text-center">
        <p className="mb-4">يرجى تسجيل الدخول لعرض تفاصيل حسابك</p>
        <a href="/login" className="px-4 py-2 bg-[#800020] text-white rounded">تسجيل الدخول</a>
      </main>
    );
  }

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
            <div className="flex items-center justify-between">
              <div className="text-sm">رقم الطلب: <b>{o.id}</b></div>
              <span className="text-xs px-2 py-1 rounded-full border text-gray-700">{o.status}</span>
            </div>
            <div className="mt-1 text-sm">الإجمالي: <b className="text-[#800020]">${o.total}</b></div>
            <div className="mt-2 text-xs text-gray-500">تاريخ: {new Date(o.createdAt).toLocaleDateString('ar')}</div>
          </div>
        ))}
      </div>
    </main>
  );
}