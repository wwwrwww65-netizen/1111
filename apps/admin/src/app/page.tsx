export default function AdminHome(): JSX.Element {
  return (
    <main style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <ul>
        <li>Products</li>
        <li>Categories</li>
        <li>Orders</li>
        <li>Coupons</li>
        <li>Users</li>
      </ul>
      <p>Connect pages to tRPC adminRouter in next edits.</p>
    </main>
  );
}