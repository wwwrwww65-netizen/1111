import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const apiUrl = 'https://jeeeyai.onrender.com/trpc/products.list?input=' + encodeURIComponent(JSON.stringify({ limit: 12 }));
    const res = await fetch(apiUrl, { cache: 'no-store', headers: { 'accept': 'application/json' } });
    if (!res.ok) return NextResponse.json({ items: [] }, { status: 200 });
    const json = await res.json();
    const items = json?.result?.data?.items || [];
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

