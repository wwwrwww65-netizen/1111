"use client";
import { useState } from "react";
import { trpc } from "../providers";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const login = trpc.auth.login.useMutation();
  const [redirect, setRedirect] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('redirect') || '/products';
    } catch { return '/products'; }
  });

  return (
    <main style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h1>تسجيل الدخول (إدارة)</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" type="password" />
        <button
          onClick={async () => {
            try {
              await login.mutateAsync({ email, password });
              window.location.href = redirect || "/products";
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          دخول
        </button>
      </div>
    </main>
  );
}