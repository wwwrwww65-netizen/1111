type PrefetchPayload = {
  imgUrl: string;
  rect?: { left: number; top: number; width: number; height: number };
  productData?: any; // Full product data from card
}
const prefetchMap = new Map<string, PrefetchPayload>()

export function setPrefetchImage(productId: string, imgUrl: string) {
  try { if (productId && imgUrl) prefetchMap.set(String(productId), { imgUrl }) } catch { }
}

export function setPrefetchPayload(productId: string, payload: PrefetchPayload) {
  try { if (productId && payload?.imgUrl) prefetchMap.set(String(productId), payload) } catch { }
}

export function consumePrefetchImage(productId: string): string | undefined {
  const p = consumePrefetchPayload(productId); return p?.imgUrl
}

export function consumePrefetchPayload(productId: string): PrefetchPayload | undefined {
  try {
    const key = String(productId || '')
    const val = prefetchMap.get(key)
    if (val) prefetchMap.delete(key)
    return val
  } catch { return undefined }
}


