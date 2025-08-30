"use client";
import { trpc } from "../../providers";
import Image from "next/image";
import React from "react";

export default function ProductDetail({ params }: { params: { id: string } }): JSX.Element {
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id: params.id });
  const addItem = trpc.cart.addItem.useMutation();
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [qty, setQty] = React.useState(1);

  if (isLoading) return <main className="p-8">Loading product...</main>;
  if (error) return <main className="p-8">Error: {error.message}</main>;
  if (!data) return <main className="p-8">Not found</main>;

  const product = data;
  const images = product.images && product.images.length ? product.images : ["/placeholder-product.jpg"];

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
        <div>
          <div className="relative w-full aspect-square bg-gray-100 rounded">
            <Image
              src={images[activeIdx]}
              alt={product.name}
              fill
              className="object-cover rounded"
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`relative w-full aspect-square rounded overflow-hidden border ${i === activeIdx ? 'border-black' : 'border-transparent'}`}
                aria-label={`thumbnail-${i}`}
              >
                <Image src={img} alt={`${product.name}-${i}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
          <div className="text-rose-600 text-xl md:text-2xl font-semibold mt-3">${product.price}</div>
          <div className="text-sm text-gray-500 mt-1">
            {product.stockQuantity > 0 ? `${product.stockQuantity} متوفر` : "غير متوفر"}
          </div>
          <p className="text-gray-700 mt-4 leading-relaxed">
            {product.description}
          </p>
          <ul className="mt-4 space-y-1 text-sm text-gray-600 list-disc pr-5">
            {(product.specs || []).map((s: string, idx: number) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border rounded">
              <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="decrease">-</button>
              <div className="px-4 py-2 min-w-[48px] text-center select-none">{qty}</div>
              <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)} aria-label="increase">+</button>
            </div>
            <button
              disabled={product.stockQuantity <= 0 || addItem.isLoading}
              onClick={async () => {
                await addItem.mutateAsync({ productId: product.id, quantity: qty });
                window.location.href = '/cart';
              }}
              className="px-5 py-3 bg-black text-white rounded disabled:opacity-50"
            >
              أضف إلى السلة
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}