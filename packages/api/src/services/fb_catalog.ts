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
  // Global de-duplication by normalized retailer_id before chunking
  const uniqueMap = new Map<string, CatalogItemInput>()
  for (const it of items) {
    const ridRaw = String(it?.retailer_id || '')
    const rid = ridRaw.trim().toLowerCase()
    if (!rid) continue
    if (!uniqueMap.has(rid)) uniqueMap.set(rid, { ...it, retailer_id: rid })
  }
  const uniqueItems = Array.from(uniqueMap.values())
  const chunks: CatalogItemInput[][] = []
  const size = 50
  for (let i = 0; i < uniqueItems.length; i += size) chunks.push(uniqueItems.slice(i, i + size))
  const results: any[] = []
  for (const group of chunks) {
    // Ensure no duplicate retailer_id within the same batch call
    const seen = new Set<string>()
    const uniqueGroup: CatalogItemInput[] = []
    for (const it of group) {
      const rid = String(it?.retailer_id || '').trim().toLowerCase()
      if (!rid) continue
      if (seen.has(rid)) continue
      seen.add(rid)
      uniqueGroup.push(it)
    }

    const requests = uniqueGroup.map((it) => ({
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
    include: { category: { select: { name: true } }, variants: true },
  } as any)
  const out: CatalogItemInput[] = []
  const seen = new Set<string>()
  for (const p of prods) {
    const id = String((p as any).id)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name = String((p as any).name || '').slice(0, 150)
    const priceNum = Number((p as any).price || 0)
    const price = `${priceNum.toFixed(2)} ${currency}`
    const url = `${appUrl}/p?id=${encodeURIComponent(id)}`
    const img = toAbsUrl(((p as any).images || [])[0] || '')
    if (!img) continue

    // Collect variant-level items when SKU exists; fallback to generated unique id if needed
    const variants: Array<any> = Array.isArray((p as any).variants) ? (p as any).variants : []
    const variantRetailerIds = new Set<string>()
    for (const v of variants) {
      const vSkuRaw = String((v as any)?.sku || '').trim()
      // Prefer variant.sku; otherwise generate stable unique id from product + variant id
      const vRid = (vSkuRaw ? vSkuRaw : `${id}-${String((v as any)?.id || '').slice(-8)}`)
      const vRidNorm = vRid.toLowerCase()
      if (!vRidNorm || variantRetailerIds.has(vRidNorm)) continue
      variantRetailerIds.add(vRidNorm)
      const vPriceNum = Number((v as any)?.price ?? priceNum)
      const vItem: CatalogItemInput = {
        retailer_id: vRid,
        name: [name, String((v as any)?.name || '').slice(0, 60)].filter(Boolean).join(' • ').slice(0, 150),
        description: String((p as any).description || '').slice(0, 5000),
        price: `${vPriceNum.toFixed(2)} ${currency}`,
        url,
        image_url: img,
        availability: 'in stock',
        brand: (p as any).brand || undefined,
        condition: 'new',
      }
      out.push(vItem)
    }

    // Add a base product item using product.sku (or product id) only if it does not collide with any variant retailer_id
    const prodRidBase = String((p as any).sku || id).trim()
    const prodRid = prodRidBase ? prodRidBase : id
    const prodRidNorm = prodRid.toLowerCase()
    if (!variantRetailerIds.has(prodRidNorm)) {
      const item: CatalogItemInput = {
        retailer_id: prodRid,
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
  }
  return out
}


