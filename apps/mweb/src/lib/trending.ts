import { API_BASE } from '@/lib/api'

let cachedIds: Set<string> | null = null
let lastFetchTs = 0
const TTL_MS = 5 * 60 * 1000

async function tryJson(path: string): Promise<any|null> {
  try{
    const res = await fetch(`${API_BASE}${path}`, { credentials:'include', headers:{ 'Accept':'application/json' } })
    if (!res.ok) return null
    return await res.json()
  }catch{ return null }
}

function extractIds(payload: any): string[] {
  try{
    if (!payload) return []
    if (Array.isArray(payload)) return payload.map((x:any)=> String(x?.id||x?._id||x).trim()).filter(Boolean)
    if (Array.isArray(payload?.items)) return payload.items.map((x:any)=> String(x?.id||x?._id||'').trim()).filter(Boolean)
    if (Array.isArray(payload?.products)) return payload.products.map((x:any)=> String(x?.id||x?._id||'').trim()).filter(Boolean)
    if (Array.isArray(payload?.list)) return payload.list.map((x:any)=> String(x?.id||x?._id||'').trim()).filter(Boolean)
    return []
  }catch{ return [] }
}

export async function getTrendingIdSet(): Promise<Set<string>>{
  const now = Date.now()
  if (cachedIds && (now - lastFetchTs) < TTL_MS) return cachedIds
  const paths = [
    '/api/admin/products/trending',
    '/api/products/trending',
    '/api/recommendations/trending',
    '/api/admin/badges/trending',
    '/api/admin/trending/products'
  ]
  let ids: string[] = []
  for (const p of paths){
    const j = await tryJson(p)
    ids = extractIds(j)
    if (ids.length) break
  }
  cachedIds = new Set(ids.map(String))
  lastFetchTs = now
  return cachedIds
}

export function markTrending<T extends { id?: any; isTrending?: boolean }>(list: T[]): T[]{
  const apply = async () => {
    try{
      const set = await getTrendingIdSet()
      for (const item of list){
        const id = String((item as any).id||'')
        if (id) (item as any).isTrending = set.has(id)
      }
    }catch{}
  }
  // Fire and forget; callers can await getTrendingIdSet themselves if needed
  apply()
  return list
}


