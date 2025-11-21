import { db } from '@repo/db';
import { apiCache, invalidateCache } from '../lib/cache-storage';

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
  await db.$queryRawUnsafe(
    `UPDATE "CacheJob" SET status=$2, result=$3, "finishedAt"=NOW() WHERE id=$1`,
    id, ok ? 'success' : 'failed', result
  );
}

async function triggerWebRevalidate(payload: { path?: string; tag?: string }) {
  try {
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://127.0.0.1:3000';
    await fetch(`${webUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-revalidate-secret': process.env.REVALIDATE_SECRET || 'jeeey-revalidate-123'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Web revalidate failed', e);
  }
}

async function runPurge(payload: any): Promise<any> {
  const keys: string[] = Array.isArray(payload?.keys) ? payload.keys : [];
  const tags: string[] = Array.isArray(payload?.tags) ? payload.tags : [];
  const domain = payload?.domain as 'WEB' | 'MWEB' | 'BOTH' | null;
  
  // Invalidate in-memory cache
  await invalidateCache(keys, tags, domain);

  // Trigger Web ISR Revalidation
  // Convert keys/tags to paths/tags for Next.js
  if (tags.length) {
    for (const tag of tags) {
      await triggerWebRevalidate({ tag });
    }
  }
  // For keys, we assume they are paths if they start with /
  if (keys.length) {
    for (const key of keys) {
      if (key.startsWith('/')) {
        await triggerWebRevalidate({ path: key });
      }
    }
  }

  // Delete by keys
  if (keys.length) {
    await db.$executeRawUnsafe(`DELETE FROM "CacheEntry" WHERE key = ANY($1)`, keys);
  }
  // Delete by tags embedded in key (convention: key contains tag like product-123)
  if (tags.length) {
    const like = tags.map((t) => `%${t}%`);
    if (domain && domain !== 'BOTH') {
      await db.$executeRawUnsafe(
        `DELETE FROM "CacheEntry" WHERE domain=$1::"CacheDomain" AND (${like.map((_, i) => `key ILIKE $${i + 2}`).join(' OR ')})`,
        domain, ...like
      );
    } else {
      await db.$executeRawUnsafe(
        `DELETE FROM "CacheEntry" WHERE ${like.map((_, i) => `key ILIKE $${i + 1}`).join(' OR ')}`,
        ...like
      );
    }
  }
  return { deleted: true };
}

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.jeeey.com') || host === 'jeeey.com';
  } catch {
    return false;
  }
}

async function runWarm(payload: any): Promise<any> {
  const urls: string[] = Array.isArray(payload?.urls) ? payload.urls : [];
  const domain = payload?.domain as 'WEB' | 'MWEB' | 'BOTH' | null;
  const results: any[] = [];
  
  for (const u of urls) {
    if (!isAllowedUrl(u)) {
      results.push({ url: u, error: 'blocked_host' });
      continue;
    }
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'Cache-Warm': '1' } });
      const buf = await r.arrayBuffer();
      const size = buf.byteLength || 0;
      const key = new URL(u).pathname || u;
      
      // If API URL and successful, cache it in memory
      const isApi = u.includes('/api/') || u.includes('/trpc/');
      if (r.ok && isApi) {
        // We can't easily store the buffer as JSON directly without parsing, 
        // but for now let's just acknowledge we 'warmed' it. 
        // A real implementation would intercept the request in the API router.
        // So here we mainly rely on the side-effect that the API handled the request.
      }

      const expiresAt: Date | null = null;
      const d = domain || (u.includes('//m.') ? 'MWEB' : 'WEB');
      await db.$executeRawUnsafe(
        `INSERT INTO "CacheEntry"(key,domain,type,"sizeBytes","createdAt","expiresAt","hitCount")
         VALUES ($1,$2,$3,$4,NOW(),$5,0)
         ON CONFLICT (key) DO UPDATE SET "sizeBytes"=EXCLUDED."sizeBytes","createdAt"=NOW(),"expiresAt"=EXCLUDED."expiresAt",domain=EXCLUDED.domain,type=EXCLUDED.type`,
        key, d, 'page', size, expiresAt
      );
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
  // Read cache settings to determine staff publish behavior (Pending vs Immediate)
  let settings: any = { staffDirectPublish: false };
  try {
    const row = await db.setting.findUnique({ where: { key: 'cache:settings' } });
    if (row?.value && typeof row.value === 'object') settings = { ...settings, ...(row.value as any) };
  } catch {}
  const actorRole = String(payload?.actorRole || '').toUpperCase();
  const isAdmin = actorRole === 'ADMIN';
  const allowStaffDirect = !!settings.staffDirectPublish;
  const effectiveImmediate = isAdmin || allowStaffDirect;
  // Purge tags and related URLs; then warm minimal set
  const purgeId = Math.random().toString(36).slice(2);
  await db.$queryRawUnsafe(
    `INSERT INTO "CacheJob"(id,type,payload,status,domain) VALUES ($1,'purge',$2,'pending',$3::"CacheDomain")`,
    purgeId, { tags, domain }, domain || null
  );
  const base = domain === 'MWEB' ? 'https://m.jeeey.com' : 'https://jeeey.com';
  const warmUrls: string[] = [
    `${base}/product/${productId}`,
    `${base}/category/${(tags.find(t=>/^category-/.test(t))||'').split('-')[1]||''}`,
    base + '/',
  ].filter(Boolean);
  const warmId = Math.random().toString(36).slice(2);
  await db.$queryRawUnsafe(
    `INSERT INTO "CacheJob"(id,type,payload,status,domain) VALUES ($1,'warm',$2,'pending',$3::"CacheDomain")`,
    warmId, { urls: warmUrls, domain }, domain || null
  );
  return { queued: true, purgeJobId: purgeId, warmJobId: warmId, immediate: effectiveImmediate };
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


