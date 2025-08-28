"use client";
import { trpc } from "../providers";

export default function CheckoutPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.cart.getCart.useQuery();
  const createOrder = q.orders.createOrder.useMutation();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">الدفع</h1>
      <div className="border p-4 rounded mb-4">الإجمالي: ${subtotal.toFixed(2)}</div>
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={async () => {
          await createOrder.mutateAsync({});
          window.location.href = "/account";
        }}
      >
        تأكيد الطلب
      </button>
    </main>
  );
}

"use client";
import { trpc } from "../providers";

export default function CheckoutPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.cart.getCart.useQuery();
  const createOrder = q.orders.createOrder.useMutation();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">الدفع</h1>
      <div className="border p-4 rounded mb-4">الإجمالي: ${subtotal.toFixed(2)}</div>
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={async () => {
          await createOrder.mutateAsync({});
          window.location.href = "/account";
        }}
      >
        تأكيد الطلب
      </button>
    </main>
  );
}

<<<<<<< HEAD
"use client";
import { trpc } from "../providers";

export default function CheckoutPage(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.cart.getCart.useQuery();
  const createOrder = q.orders.createOrder.useMutation();

  if (isLoading) return <main className="p-8">Loading...</main>;
  if (error) return <main className="p-8">Error: {(error as any).message}</main>;

  const subtotal = data?.subtotal ?? 0;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">الدفع</h1>
      <div className="border p-4 rounded mb-4">الإجمالي: ${subtotal.toFixed(2)}</div>
      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={async () => {
          await createOrder.mutateAsync({});
          window.location.href = "/account";
        }}
      >
        تأكيد الطلب
      </button>
=======
export default function CheckoutPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Checkout</h1>
      <p>Enter your shipping and payment details to complete your purchase.</p>
>>>>>>> origin/main
    </main>
  );
}