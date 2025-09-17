import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const jar = cookies();
    const entries: Array<{ name: string; value: string }> = [];
    jar.getAll().forEach((c) => entries.push({ name: c.name, value: c.value }));
    return NextResponse.json({ cookies: entries }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

