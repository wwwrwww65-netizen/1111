"use client";
import { trpc } from "../../providers";
import Image from "next/image";
import React from "react";
import { ProductCard } from "@repo/ui";
import { useI18n } from "../../lib/i18n";

export default function ProductDetail({ params }: { params: { id: string } }): JSX.Element {
  const { t } = useI18n();
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id: params.id });
  const addItem = trpc.cart.addItem.useMutation();
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [tab, setTab] = React.useState<'desc' | 'specs' | 'reviews'>("desc");
  const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
  const [showShip, setShowShip] = React.useState(false);
  const [showReturn, setShowReturn] = React.useState(false);

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
          {/* Tabs */}
          <div className="mt-5 border-b flex items-center gap-6 text-sm">
            <button className={`pb-2 ${tab==='desc'?'border-b-2 border-black':''}`} onClick={()=>setTab('desc')}>{t('description')}</button>
            <button className={`pb-2 ${tab==='specs'?'border-b-2 border-black':''}`} onClick={()=>setTab('specs')}>{t('specs')}</button>
            <button className={`pb-2 ${tab==='reviews'?'border-b-2 border-black':''}`} onClick={()=>setTab('reviews')}>{t('reviews')}</button>
          </div>
          {tab === 'desc' && (
            <p className="text-gray-700 mt-4 leading-relaxed">{product.description}</p>
          )}
          {tab === 'specs' && (
            <div className="mt-4">
              {/* Size swatches */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">{t('size')}</div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedSize(v.name)}
                        className={`px-3 py-1.5 border rounded ${selectedSize===v.name? 'border-black bg-black text-white':'bg-white'}`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ul className="space-y-1 text-sm text-gray-600 list-disc pr-5">
                {(product.specs || []).map((s: any, idx: number) => (
                  <li key={idx}>{typeof s === 'string' ? s : `${s.name}: ${s.value}`}</li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'reviews' && (
            <div className="mt-4 text-sm text-gray-700">التقييم العام: {product.averageRating} ({product.reviewCount} تقييم)</div>
          )}
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
              {t('addToCart')}
            </button>
          </div>
          {/* Accordions: Shipping & Returns */}
          <div className="mt-6 space-y-2">
            <div className="border rounded">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm" onClick={() => setShowShip((v)=>!v)}>
                <span>{t('shipping')}</span>
                <span>{showShip ? '−' : '+'}</span>
              </button>
              {showShip && (
                <div className="px-3 pb-3 text-sm text-gray-600">شحن خلال 2-5 أيام عمل. تتبع فوري عند الشحن.</div>
              )}
            </div>
            <div className="border rounded">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm" onClick={() => setShowReturn((v)=>!v)}>
                <span>{t('returns')}</span>
                <span>{showReturn ? '−' : '+'}</span>
              </button>
              {showReturn && (
                <div className="px-3 pb-3 text-sm text-gray-600">إرجاع خلال 15 يومًا وفق الشروط.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Sticky ATC on mobile */}
      <div className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white p-3 flex items-center justify-between z-40">
        <div className="text-sm">${product.price}</div>
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={async () => { await addItem.mutateAsync({ productId: product.id, quantity: 1 }); window.location.href = '/cart'; }}
        >
          {t('addToCart')}
        </button>
      </div>
      {/* Recommended products */}
      <section className="mt-12">
        <h2 className="text-xl md:text-2xl font-bold mb-4">منتجات مقترحة</h2>
        {/* Fallback to latest list; ideally filter by same category */}
        <RecommendedGrid />
      </section>
    </main>
  );
}

function RecommendedGrid(): JSX.Element {
  const query: any = (trpc as any);
  const { data } = query.products.list.useQuery({ limit: 10 });
  const items = data?.items ?? [];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((p: any) => (
        <ProductCard
          key={p.id}
          product={{ id: p.id, name: p.name, description: p.description, price: p.price, images: p.images, stock: p.stockQuantity, rating: p.averageRating || 0, reviewCount: p.reviewCount || 0 }}
          onViewDetails={(id) => (window.location.href = `/products/${id}`)}
        />
      ))}
    </div>
  );
}