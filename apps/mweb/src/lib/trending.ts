import { apiGet, API_BASE } from '@/lib/api'

let cachedIds: Set<string> | null = null
let lastFetchTs = 0
const TTL_MS = 5 * 60 * 1000

async function tryJson(path: string): Promise<any|null> { try{ return await apiGet<any>(path) }catch{ return null } }

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
  // اربط باللوحة فقط: إن كان نظام الترندات متاحاً سيُعيد بيانات، وإلا نعتبره غير مُفعل بدون محاولات إضافية
  let ids: string[] = []
  try{
    const j = await apiGet<any>('/api/trending/products')
    ids = extractIds(j)
  }catch{ ids = [] }
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


