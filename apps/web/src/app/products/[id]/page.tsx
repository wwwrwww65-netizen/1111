"use client";
import { trpc } from "../../providers";
import Image from "next/image";

export default function ProductDetail({ params }: { params: { id: string } }): JSX.Element {
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id: params.id });

  if (isLoading) return <main className="p-8">Loading product...</main>;
  if (error) return <main className="p-8">Error: {error.message}</main>;
  if (!data) return <main className="p-8">Not found</main>;

  const product = data;

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full h-96 bg-gray-100">
            <Image
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {product.images.slice(1, 5).map((img: string, i: number) => (
              <div key={i} className="relative w-full h-24 bg-gray-100">
                <Image src={img} alt={`${product.name}-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <div className="text-2xl font-semibold mt-4">${product.price}</div>
          <div className="text-sm text-gray-500 mt-1">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </div>
          <button className="mt-6 px-4 py-2 bg-black text-white rounded">Add to Cart</button>
        </div>
      </div>
    </main>
  );
}

"use client";
import { trpc } from "../../providers";
import Image from "next/image";

export default function ProductDetail({ params }: { params: { id: string } }): JSX.Element {
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id: params.id });

  if (isLoading) return <main className="p-8">Loading product...</main>;
  if (error) return <main className="p-8">Error: {error.message}</main>;
  if (!data) return <main className="p-8">Not found</main>;

  const product = data;

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full h-96 bg-gray-100">
            <Image
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {product.images.slice(1, 5).map((img: string, i: number) => (
              <div key={i} className="relative w-full h-24 bg-gray-100">
                <Image src={img} alt={`${product.name}-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <div className="text-2xl font-semibold mt-4">${product.price}</div>
          <div className="text-sm text-gray-500 mt-1">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </div>
          <button className="mt-6 px-4 py-2 bg-black text-white rounded">Add to Cart</button>
        </div>
      </div>
    </main>
  );
}

<<<<<<< HEAD
"use client";
import { trpc } from "../../providers";
import Image from "next/image";

export default function ProductDetail({ params }: { params: { id: string } }): JSX.Element {
  const { data, isLoading, error } = trpc.products.getById.useQuery({ id: params.id });

  if (isLoading) return <main className="p-8">Loading product...</main>;
  if (error) return <main className="p-8">Error: {error.message}</main>;
  if (!data) return <main className="p-8">Not found</main>;

  const product = data;

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="relative w-full h-96 bg-gray-100">
            {/* Using next/image for optimization */}
            <Image
              src={product.images[0] || "/placeholder-product.jpg"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {product.images.slice(1, 5).map((img: string, i: number) => (
              <div key={i} className="relative w-full h-24 bg-gray-100">
                <Image src={img} alt={`${product.name}-${i}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <div className="text-2xl font-semibold mt-4">${product.price}</div>
          <div className="text-sm text-gray-500 mt-1">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </div>
          <button className="mt-6 px-4 py-2 bg-black text-white rounded">Add to Cart</button>
        </div>
      </div>
=======
interface ProductPageProps {
  params: { id: string }
}

export const dynamicParams = false;
export async function generateStaticParams() {
  return [] as { id: string }[];
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Product {params.id}</h1>
      <p>Product details will be displayed here.</p>
>>>>>>> origin/main
    </main>
  );
}