// New register page
"use client";
import React from 'react';
import { trpc } from "../../providers";

export default function RegisterPage(): JSX.Element {
  const rpc: any = trpc as any;
  const register = rpc.auth.register.useMutation();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ name, email, phone, password });
      // After successful register, link anonymous session
      try{
        const sid = typeof window!=='undefined'? (localStorage.getItem('sid_v1')||'') : '';
        if (sid){
          await fetch('/api/analytics/link', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ sessionId: sid }) });
        }
      }catch{}
      const dest = new URL('/account', window.location.origin).toString();
      window.location.assign(dest);
    } catch (e: any) {
      setError(e?.message || "فشل إنشاء الحساب");
    }
  };

  return (
    <main className="min-h-screen p-4 max-w-sm mx-auto flex items-center">
      <form onSubmit={onSubmit} className="w-full border rounded p-4 space-y-3 bg-white">
        <h1 className="text-xl font-bold mb-1">إنشاء حساب</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input value={name} onChange={(e)=> setName(e.target.value)} placeholder="الاسم الكامل" className="w-full border rounded px-3 py-2 focus:border-[#800020]" required />
        <input type="email" value={email} onChange={(e)=> setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full border rounded px-3 py-2 focus:border-[#800020]" required />
        <input value={phone} onChange={(e)=> setPhone(e.target.value)} placeholder="رقم الهاتف (اختياري)" className="w-full border rounded px-3 py-2 focus:border-[#800020]" />
        <input type="password" value={password} onChange={(e)=> setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full border rounded px-3 py-2 focus:border-[#800020]" required />
        <button type="submit" className="w-full px-4 py-2 bg-[#800020] text-white rounded">إنشاء حساب</button>
        <div className="text-sm text-center">
          لديك حساب؟ <a href="/login" className="text-[#800020] underline">تسجيل الدخول</a>
        </div>
      </form>
    </main>
  );
}