"use client";
import { trpc } from "../providers";

export default function AdminProducts(): JSX.Element {
  const q: any = trpc as any;
  const { data, isLoading, error } = q.admin.getProducts.useQuery({ page: 1, limit: 20 });

  if (isLoading) return <main style={{ padding: 24 }}>Loading products...</main>;
  if (error) return <main style={{ padding: 24 }}>Error: {(error as any).message}</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>إدارة المنتجات</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>الاسم</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>السعر</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>التصنيف</th>
          </tr>
        </thead>
        <tbody>
          {(data?.products ?? []).map((p: any) => (
            <tr key={p.id}>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{p.name}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>${p.price}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f0f0f0" }}>{p.category?.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}