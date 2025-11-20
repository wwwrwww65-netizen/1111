// Facebook Catalog Graph API upsert (items_batch)
// Requires env: FB_CATALOG_ID, FB_CATALOG_TOKEN

import { db } from '@repo/db'

type CatalogItemInput = {
  retailer_id: string
  name: string
  description?: string
  price: string // e.g., "99.99 YER"
  url: string
  image_url: string
  availability?: 'in stock' | 'out of stock' | 'preorder'
  brand?: string
  condition?: 'new' | 'used' | 'refurbished'
  additional_image_urls?: string[]
  gpc?: number
}

export async function fbCatalogUpsert(items: CatalogItemInput[]): Promise<{ ok: boolean; results: any[] }> {
  let catalogId = process.env.FB_CATALOG_ID
  let token = process.env.FB_CATALOG_TOKEN
  if (!catalogId || !token) {
    try {
      // Try to load from DB settings (prefer mweb, then web)
      const sM = await db.setting.findUnique({ where: { key: 'integrations:meta:settings:mweb' } })
      const sW = await db.setting.findUnique({ where: { key: 'integrations:meta:settings:web' } })
      const v: any = (sM?.value as any) || (sW?.value as any) || {}
      catalogId = catalogId || v.catalogId
      token = token || v.systemUserToken || v.catalogToken
    } catch {}
  }
  if (!catalogId || !token) return { ok: false, results: [] }
  const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(catalogId)}/items_batch?access_token=${encodeURIComponent(token)}&item_type=PRODUCT_ITEM&allow_upsert=true`
  const chunks: CatalogItemInput[][] = []
  const size = 50
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  const results: any[] = []
  for (const group of chunks) {
    const requests = group.map((it) => ({
      method: 'CREATE',
      retailer_id: it.retailer_id,
      item_type: 'PRODUCT_ITEM',
      data: {
        name: it.name,
        description: it.description || '',
        image_url: it.image_url,
        url: it.url,
        price: it.price, // "<amount> <CURRENCY>"
        availability: it.availability || 'in stock',
        brand: it.brand || undefined,
        condition: it.condition || 'new',
        additional_image_urls: Array.isArray(it.additional_image_urls) && it.additional_image_urls.length ? it.additional_image_urls : undefined,
        google_product_category: it.gpc || undefined,
      },
    }))
    const form = new URLSearchParams()
    form.set('item_type', 'PRODUCT_ITEM')
    form.set('allow_upsert', 'true')
    form.set('requests', JSON.stringify(requests))
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const json = await resp.json().catch(() => ({}))
    results.push({ status: resp.status, body: json })
  }
  return { ok: true, results }
}

export function toAbsUrl(u: string): string {
  const s = String(u || '').trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  const api = process.env.PUBLIC_API_BASE || process.env.API_BASE || 'https://api.jeeey.com'
  if (s.startsWith('/uploads')) return `${api}${s}`
  if (s.startsWith('uploads/')) return `${api}/${s}`
  return s
}

export async function buildCatalogItemsFromProducts(prodIds?: string[]): Promise<CatalogItemInput[]> {
  const appUrl = process.env.MWEB_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://m.jeeey.com'
  const currency = process.env.DEFAULT_CURRENCY || 'YER'
  const where: any = { isActive: true }
  if (Array.isArray(prodIds) && prodIds.length) where.id = { in: prodIds }
  const prods = await db.product.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: prodIds && prodIds.length ? undefined : 1000,
    include: { category: { select: { name: true } } },
  } as any)
  const out: CatalogItemInput[] = []
  for (const p of prods) {
    const id = String((p as any).id)
    const name = String((p as any).name || '').slice(0, 150)
    const priceNum = Number((p as any).price || 0)
    const price = `${priceNum.toFixed(2)} ${currency}`
    const url = `${appUrl}/p?id=${encodeURIComponent(id)}`
    const img = toAbsUrl(((p as any).images || [])[0] || '')
    if (!img) continue
    const item: CatalogItemInput = {
      retailer_id: id,
      name,
      description: String((p as any).description || '').slice(0, 5000),
      price,
      url,
      image_url: img,
      availability: 'in stock',
      brand: (p as any).brand || undefined,
      condition: 'new',
    }
    out.push(item)
  }
  return out
}


