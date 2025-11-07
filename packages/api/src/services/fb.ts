// Facebook Pixel Conversions API (server-side events)
// Sends minimal Purchase/AddToCart/PageView events with optional user data

import { db } from '@repo/db'

type FbUserData = {
  em?: string
  ph?: string
  fn?: string
  ln?: string
  external_id?: string
  fbp?: string
  fbc?: string
  client_ip_address?: string
  client_user_agent?: string
}

type FbEvent = {
  event_name: string
  event_time?: number
  event_source_url?: string
  action_source?: 'website' | 'app' | 'email' | 'other'
  user_data?: FbUserData
  custom_data?: Record<string, any>
  event_id?: string
}

async function loadMetaPixelConfig(): Promise<{ pixelId?: string; token?: string; testCode?: string }>{
  try{
    const sM = await db.setting.findUnique({ where: { key: 'integrations:meta:settings:mweb' } })
    const sW = await db.setting.findUnique({ where: { key: 'integrations:meta:settings:web' } })
    const v:any = (sM?.value as any) || (sW?.value as any) || {}
    return { pixelId: v.pixelId, token: v.conversionsToken, testCode: v.testEventCode }
  }catch{ return {} }
}

export async function fbSendEvents(events: FbEvent[]): Promise<{ ok: boolean; status: number; body?: any }> {
  // Simple in-memory metrics for alerting
  ;(global as any).__fb_metrics__ = (global as any).__fb_metrics__ || { window: [] as Array<{ t:number; ok:boolean }> , lastAlert: 0 }
  const metrics = (global as any).__fb_metrics__
  let pixelId = process.env.FB_PIXEL_ID
  let token = process.env.FB_CAPI_TOKEN
  let testCode: string | undefined = process.env.FB_TEST_EVENT_CODE
  if ((!pixelId || !token)){
    const cfg = await loadMetaPixelConfig()
    pixelId = pixelId || cfg.pixelId
    token = token || cfg.token
    testCode = testCode || cfg.testCode
  }
  if (!pixelId || !token || !Array.isArray(events) || events.length === 0) {
    return { ok: false, status: 0 }
  }
  const payload = {
    data: events.map((e) => ({
      event_name: e.event_name,
      event_time: e.event_time || Math.floor(Date.now() / 1000),
      action_source: e.action_source || 'website',
      event_source_url: e.event_source_url,
      event_id: e.event_id,
      user_data: e.user_data,
      custom_data: e.custom_data,
    })),
    test_event_code: testCode || undefined,
  }
  try {
    try{ console.log('[FB CAPI] outgoing payload', JSON.stringify(payload)) }catch{}
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${token}`
    // retry with backoff for transient failures
    const attempt = async (n: number): Promise<{ ok:boolean; status:number; body:any }> => {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const body = await res.json().catch(() => ({}))
      if (res.ok || n >= 3) return { ok: res.ok, status: res.status, body }
      // 429/5xx retry
      if (res.status >= 500 || res.status === 429) {
        await new Promise(r=> setTimeout(r, n===1? 200 : 600))
        return attempt(n+1)
      }
      return { ok: res.ok, status: res.status, body }
    }
    const out = await attempt(1)
    try{ console.log('[FB CAPI] response', out.status, JSON.stringify(out.body)) }catch{}
    // metrics window (5 minutes)
    try{
      const now = Date.now()
      metrics.window.push({ t: now, ok: out.ok })
      const cutoff = now - 5*60*1000
      metrics.window = metrics.window.filter((e:any)=> e.t >= cutoff)
      const total = metrics.window.length
      const failures = metrics.window.filter((e:any)=> !e.ok).length
      const rate = total>0 ? (failures/total) : 0
      const threshold = Number(process.env.FB_ALERT_ERROR_RATE||0.4)
      const minEvents = Number(process.env.FB_ALERT_MIN_EVENTS||30)
      if (total >= minEvents && rate >= threshold && (now - metrics.lastAlert > 5*60*1000)){
        metrics.lastAlert = now
        console.warn(`[FB CAPI][ALERT] High error rate ${(rate*100).toFixed(1)}% over ${total} events in 5m`)
        // optional webhook
        const hook = process.env.ALERT_WEBHOOK_URL
        if (hook) { try{ await fetch(hook, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: `FB CAPI high error rate ${(rate*100).toFixed(1)}% (${failures}/${total})` }) }) }catch{} }
      }
    }catch{}
    return out
  } catch {
    return { ok: false, status: 0 }
  }
}

export function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined
  try {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex')
  } catch {
    return undefined
  }
}

