const prefetchMap = new Map<string, string>()

export function setPrefetchImage(productId: string, imgUrl: string){
  try{ if (productId && imgUrl) prefetchMap.set(String(productId), String(imgUrl)) }catch{}
}

export function consumePrefetchImage(productId: string): string|undefined{
  try{
    const key = String(productId||'')
    const val = prefetchMap.get(key)
    if (val) prefetchMap.delete(key)
    return val
  }catch{ return undefined }
}


