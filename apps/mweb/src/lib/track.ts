import { apiPost } from './api'

function ensureSessionId(): string {
  try{
    const k = 'sid_v1'
    let v = localStorage.getItem(k) || ''
    if (!v){
      v = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      localStorage.setItem(k, v)
    }
    return v
  }catch{ return Math.random().toString(36).slice(2) }
}

function currency(): string {
  try{ return (window as any).__CURRENCY_CODE__ || 'YER' }catch{ return 'YER' }
}

export type MetaEventPayload = {
  value?: number
  currency?: string
  content_ids?: string[]
  content_type?: 'product'|'product_group'|'category'|string
  contents?: Array<{ id:string; quantity?: number; item_price?: number }>
  order_id?: string
  payment_method?: string
  coupon?: string
  shipping?: number
  search_string?: string
  email?: string
  phone?: string
}

export async function trackEvent(name: string, payload: MetaEventPayload = {}, explicitEventId?: string): Promise<string> {
  const ts = Math.floor(Date.now()/1000)
  const sid = ensureSessionId()
  const eid = explicitEventId || `${name}_${payload.order_id || sid}_${ts}`
  const cur = payload.currency || currency()
  const pixelParams: any = {
    ...(payload.value!=null? { value: Number(payload.value)||0 }: {}),
    currency: cur,
    ...(payload.content_ids? { content_ids: payload.content_ids }: {}),
    ...(payload.content_type? { content_type: payload.content_type }: {}),
    ...(payload.contents? { contents: payload.contents }: {}),
    ...(payload.search_string? { search_string: payload.search_string }: {})
  }
  try{
    const fbq = (window as any).fbq
    if (typeof fbq === 'function'){
      fbq('track', name, pixelParams, { eventID: eid })
    }
  }catch{}
  try{
    await apiPost('/api/events/track', {
      event_name: name,
      event_id: eid,
      event_time: ts,
      event_source_url: typeof location!=='undefined'? location.href : undefined,
      custom_data: {
        ...(payload.value!=null? { value: Number(payload.value)||0 }: {}),
        currency: cur,
        ...(payload.content_ids? { content_ids: payload.content_ids }: {}),
        ...(payload.content_type? { content_type: payload.content_type }: {}),
        ...(payload.contents? { contents: payload.contents }: {}),
        ...(payload.order_id? { order_id: payload.order_id }: {}),
        ...(payload.payment_method? { payment_method: payload.payment_method }: {}),
        ...(payload.coupon? { coupon: payload.coupon }: {}),
        ...(payload.shipping!=null? { shipping: Number(payload.shipping)||0 }: {}),
        ...(payload.search_string? { search_string: payload.search_string }: {})
      },
      // Optional user hints for hashing server-side
      email: payload.email || undefined,
      phone: payload.phone || undefined
    })
  }catch{}
  return eid
}


