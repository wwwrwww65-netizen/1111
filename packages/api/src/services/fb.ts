// Facebook Pixel Conversions API (server-side events)
// Sends minimal Purchase/AddToCart/PageView events with optional user data

type FbUserData = {
  em?: string
  ph?: string
  fn?: string
  ln?: string
  external_id?: string
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

export async function fbSendEvents(events: FbEvent[]): Promise<{ ok: boolean; status: number; body?: any }> {
  const pixelId = process.env.FB_PIXEL_ID
  const token = process.env.FB_CAPI_TOKEN
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
    test_event_code: process.env.FB_TEST_EVENT_CODE || undefined,
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, body }
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

