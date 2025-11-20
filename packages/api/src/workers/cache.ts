import { db } from '@repo/db';

type CacheJobRow = {
  id: string;
  type: string;
  payload: any;
  status: string;
  idempotencyKey?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  domain?: 'WEB' | 'MWEB' | 'BOTH' | null;
};

async function takeNextPendingJob(): Promise<CacheJobRow | null> {
  // Simple transactional claim
  const rows = await db.$queryRawUnsafe<CacheJobRow[]>(
    `UPDATE "CacheJob" SET status='running', "startedAt"=NOW()
     WHERE id IN (SELECT id FROM "CacheJob" WHERE status='pending' ORDER BY "createdAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING id, type, payload, status, "idempotencyKey", "createdAt", "createdBy", domain`
  );
  return rows && rows[0] ? rows[0] : null;
}

async function finishJob(id: string, ok: boolean, result: any): Promise<void> {
  await (db as any).cacheJob.update({
    where: { id },
    data: { status: ok ? 'success' : 'failed', result, finishedAt: new Date() } as any,
  } as any);
}

async function runPurge(payload: any): Promise<any> {
  const keys: string[] = Array.isArray(payload?.keys) ? payload.keys : [];
  const tags: string[] = Array.isArray(payload?.tags) ? payload.tags : [];
  const domain = payload?.domain as 'WEB' | 'MWEB' | 'BOTH' | null;
  // Delete by keys
  if (keys.length) {
    await db.$executeRawUnsafe(`DELETE FROM "CacheEntry" WHERE key = ANY($1)`, keys);
  }
  // Delete by tags embedded in key (convention: key contains tag like product-123)
  if (tags.length) {
    const like = tags.map((t) => `%${t}%`);
    await db.$executeRawUnsafe(
      `DELETE FROM "CacheEntry" WHERE ${domain && domain !== 'BOTH' ? `domain='${domain}' AND ` : ''} (${like.map((_, i) => `key ILIKE $${i + 1}`).join(' OR ')})`,
      ...like
    );
  }
  return { deleted: true };
}

async function runWarm(payload: any): Promise<any> {
  const urls: string[] = Array.isArray(payload?.urls) ? payload.urls : [];
  const domain = payload?.domain as 'WEB' | 'MWEB' | 'BOTH' | null;
  const results: any[] = [];
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'Cache-Warm': '1' } });
      const buf = await r.arrayBuffer();
      const size = buf.byteLength || 0;
      const key = new URL(u).pathname || u;
      const expiresAt: Date | null = null;
      const d = domain || (u.includes('//m.') ? 'MWEB' : 'WEB');
      await (db as any).cacheEntry.upsert({
        where: { key },
        update: {
          sizeBytes: size,
          createdAt: new Date(),
          expiresAt,
          type: 'page',
          domain: d as any,
        },
        create: {
          key,
          sizeBytes: size,
          createdAt: new Date(),
          expiresAt,
          type: 'page',
          domain: d as any,
          hitCount: 0,
        },
      } as any);
      results.push({ url: u, status: r.status, size });
    } catch (e: any) {
      results.push({ url: u, error: e?.message || 'fetch_failed' });
    }
  }
  return { warmed: results.length, results };
}

async function runProductPublished(payload: any): Promise<any> {
  const productId: number = Number(payload?.product_id || payload?.productId || 0);
  const domain = payload?.domain as 'WEB' | 'MWEB' | 'BOTH' | null;
  const tags: string[] = Array.isArray(payload?.tags) ? payload.tags : [];
  // Purge tags and related URLs; then warm minimal set
  const purgeJob = await (db as any).cacheJob.create({ data: { type: 'purge', payload: { tags, domain }, status: 'pending', domain } as any });
  const base = domain === 'MWEB' ? 'https://m.jeeey.com' : 'https://jeeey.com';
  const warmUrls: string[] = [
    `${base}/product/${productId}`,
    `${base}/category/${(tags.find(t=>/^category-/.test(t))||'').split('-')[1]||''}`,
    base + '/',
  ].filter(Boolean);
  const warmJob = await (db as any).cacheJob.create({ data: { type: 'warm', payload: { urls: warmUrls, domain }, status: 'pending', domain } as any });
  return { queued: true, purgeJobId: purgeJob.id, warmJobId: warmJob.id };
}

async function process(job: CacheJobRow): Promise<void> {
  try {
    let result: any = null;
    if (job.type === 'purge') result = await runPurge(job.payload);
    else if (job.type === 'warm') result = await runWarm(job.payload);
    else if (job.type === 'product_published') result = await runProductPublished(job.payload);
    else result = { skipped: true, reason: 'unknown_type' };
    await finishJob(job.id, true, result);
  } catch (e: any) {
    await finishJob(job.id, false, { error: e?.message || 'failed' });
  }
}

let started = false;
export function startCacheWorker(): void {
  if (started) return;
  started = true;
  // Polling loop (every 1s)
  setInterval(async () => {
    try {
      let guard = 0;
      while (guard++ < 10) {
        const job = await takeNextPendingJob();
        if (!job) break;
        await process(job);
      }
      // Update global summary for health endpoint
      try {
        const rows: any[] = await db.$queryRawUnsafe(`SELECT status, COUNT(*)::int AS c FROM "CacheJob" WHERE "createdAt" > NOW() - INTERVAL '1 day' GROUP BY status`);
        (global as any).__queues_summary = rows;
      } catch {}
    } catch {}
  }, 1000);
}


