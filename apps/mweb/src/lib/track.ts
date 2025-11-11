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
  try{ console.log('trackEvent fired', { name, event_id: eid, custom_data: payload }) }catch{}
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
    if (typeof fbq === 'function' && name !== 'PageView'){
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
  // Persist normalized event into DB for Admin analytics/realtime
  try{
    const url = typeof location!=='undefined' ? new URL(location.href) : null
    const params = url ? Object.fromEntries(url.searchParams.entries()) : {}
    const mapName = (n:string)=>{
      const s = n.toLowerCase()
      if (s==='pageview') return 'page_view'
      if (s==='addtocart') return 'add_to_cart'
      if (s==='initiatecheckout' || s==='checkout') return 'checkout'
      if (s==='purchase') return 'purchase'
      return s
    }
    const pid0 = (payload as any)?.content_ids?.[0]
    await apiPost('/api/events', {
      name: mapName(name),
      sessionId: sid,
      pageUrl: typeof location!=='undefined'? location.href : undefined,
      referrer: typeof document!=='undefined'? document.referrer : undefined,
      productId: pid0 || undefined,
      orderId: payload.order_id || undefined,
      utm_source: (params as any).utm_source,
      utm_medium: (params as any).utm_medium,
      utm_campaign: (params as any).utm_campaign,
      properties: {
        // duplicate critical fields for legacy queries that read from properties JSON
        sessionId: sid,
        pageUrl: typeof location!=='undefined'? location.href : undefined,
        referrer: typeof document!=='undefined'? document.referrer : undefined,
        utm_source: (params as any).utm_source,
        utm_medium: (params as any).utm_medium,
        utm_campaign: (params as any).utm_campaign,
        ...(pid0? { productId: pid0 }: {}),
        value: (payload as any)?.value,
        currency: cur,
        contents: (payload as any)?.contents,
        content_type: (payload as any)?.content_type
      }
    })
  }catch{}
  return eid
}


