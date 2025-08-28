"use client";
import { useState } from "react";

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

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
              const res = await fetch((process.env.NEXT_PUBLIC_TRPC_URL || "http://localhost:4000/trpc") + "/auth.login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ input: { email, password } }),
              });
              if (!res.ok) throw new Error("فشل تسجيل الدخول");
              window.location.href = "/";
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