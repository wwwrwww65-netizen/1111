interface ProductPageProps {
  params: { id: string }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Product {params.id}</h1>
      <p>Product details will be displayed here.</p>
    </main>
  );
}