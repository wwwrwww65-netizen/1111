// New login page
"use client";
import React from 'react';
import { trpc } from "../../providers";

export default function LoginPage(): JSX.Element {
  const rpc: any = trpc as any;
  const login = rpc.auth.login.useMutation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email, password });
      const dest = new URL('/account', window.location.origin).toString();
      window.location.assign(dest);
    } catch (e: any) {
      setError(e?.message || "فشل تسجيل الدخول");
    }
  };

  return (
    <main className="min-h-screen p-4 max-w-sm mx-auto flex items-center">
      <form onSubmit={onSubmit} className="w-full border rounded p-4 space-y-3 bg-white">
        <h1 className="text-xl font-bold mb-1">تسجيل الدخول</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input type="email" value={email} onChange={(e)=> setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full border rounded px-3 py-2 focus:border-[#800020]" required />
        <input type="password" value={password} onChange={(e)=> setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full border rounded px-3 py-2 focus:border-[#800020]" required />
        <button type="submit" className="w-full px-4 py-2 bg-[#800020] text-white rounded">دخول</button>
        <div className="text-sm text-center">
          ليس لديك حساب؟ <a href="/register" className="text-[#800020] underline">إنشاء حساب</a>
        </div>
      </form>
    </main>
  );
}