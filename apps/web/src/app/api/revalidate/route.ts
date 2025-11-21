import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secret = req.headers.get('x-revalidate-secret');
    
    // TODO: Move secret to env variable
    if (secret !== process.env.REVALIDATE_SECRET && secret !== 'jeeey-revalidate-123') {
       return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    const { path, tag } = body;
    
    if (path) {
      revalidatePath(path);
    }
    
    if (tag) {
      revalidateTag(tag);
    }

    return NextResponse.json({ revalidated: true, path, tag });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

