import { defineStore } from 'pinia'
import { apiGet, apiPost } from '@/lib/api'

export type CartItem = {
  uid: string; // unique per product + variant selection
  id: string; // productId
  title: string;
  price: number;
  img?: string;
  qty: number;
  variantColor?: string;
  variantSize?: string;
}

export const useCart = defineStore('cart', {
  state: () => ({ items: [] as CartItem[], loaded: false }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.qty * i.price, 0)
  },
  actions: {
    computeUid(productId: string, color?: string, size?: string) {
      const c = String(color || '').trim().toLowerCase()
      const s = String(size || '').trim().toLowerCase()
      return `${productId}|${c}|${s}`
    },
    loadLocal() {
      try {
        const j = localStorage.getItem('cart_v1'); if (j) {
          const arr = JSON.parse(j) || []; if (Array.isArray(arr)) this.items = arr.map((it: any) => {
            const id = String(it.id || '')
            const uid = it.uid || `${id}|${String(it.variantColor || '').trim().toLowerCase()}|${String(it.variantSize || '').trim().toLowerCase()}`
            return { ...it, id, uid }
          })
        }
      } catch { }
    },
    saveLocal() { try { localStorage.setItem('cart_v1', JSON.stringify(this.items)) } catch { } },
    async syncFromServer(force = false) {
      // When force=true, always hydrate from server (used after login/merge)
      if (!force && this.items.length > 0) { this.loaded = true; return }
      const data = await apiGet<any>('/api/cart')
      if (data && data.cart) {
        this.items = (data.cart.items || []).map((ci: any) => {
          const id = String(ci.productId)
          const attr = (ci as any).attributes || {}
          const color = attr.color || undefined
          const size = attr.size || undefined
          const img = attr.colorImageUrl || (ci.product?.images?.[0] || undefined)
          const uid = this.computeUid(id, color, size)
          return { uid, id, title: ci.product?.name || ci.productId, price: Number(ci.product?.price || 0), img, qty: ci.quantity, variantColor: color, variantSize: size }
        })
      }
      this.loaded = true
    },
    async add(item: Omit<CartItem, 'qty' | 'uid'>, qty = 1) {
      const uid = this.computeUid(item.id, item.variantColor, item.variantSize)
      const ex = this.items.find(i => i.uid === uid)
      if (ex) ex.qty += qty
      else this.items.push({ ...item, uid, qty })
      // fire and forget server sync
      apiPost('/api/cart/add', { productId: item.id, quantity: qty, attributes: { color: item.variantColor, size: item.variantSize, colorImageUrl: item.img } }).catch(() => { })
      // Track AddToCart via Pixel + CAPI with dedupe-ready event_id
      try {
        const { trackEvent } = await import('@/lib/track')
        const priceNum = Number(item.price || 0)
        trackEvent('AddToCart', {
          value: priceNum,
          currency: (window as any).__CURRENCY_CODE__ || 'YER',
          content_ids: [String(item.id)],
          content_type: 'product_group',
          contents: [{ id: String(item.id), quantity: Number(qty || 1), item_price: priceNum }]
        })
      } catch { }
      this.saveLocal()
      try { window.dispatchEvent(new CustomEvent('cart:add', { detail: { productId: item.id, qty } })) } catch { }
    },
    upsertVariantMeta(uid: string, meta: { color?: string; size?: string; img?: string }) {
      const it = this.items.find(i => i.uid === uid)
      if (!it) return
      if (typeof meta.color === 'string') it.variantColor = meta.color
      if (typeof meta.size === 'string') it.variantSize = meta.size
      if (typeof meta.img === 'string' && meta.img) it.img = meta.img
      // recompute uid; merge if another item matches new uid
      const newUid = this.computeUid(it.id, it.variantColor, it.variantSize)
      if (newUid !== it.uid) {
        const other = this.items.find(x => x.uid === newUid)
        if (other) { other.qty += it.qty; this.items = this.items.filter(x => x !== it) }
        else { it.uid = newUid }
      }
      // sync attributes to server (best-effort)
      apiPost('/api/cart/update', { productId: it.id, quantity: it.qty, attributes: { color: it.variantColor, size: it.variantSize, colorImageUrl: it.img } }).catch(() => { })
      this.saveLocal()
    },
    async remove(uid: string) {
      const it = this.items.find(i => i.uid === uid)
      if (!it) return
      this.items = this.items.filter(i => i.uid !== uid)
      try { await apiPost('/api/cart/remove', { productId: it.id, attributes: { color: it.variantColor, size: it.variantSize, colorImageUrl: it.img } }) } catch { }
      // Ensure local state matches DB after removal
      try { await this.syncFromServer(true) } catch { }
      try {
        const { trackEvent } = await import('@/lib/track')
        const priceNum = Number(it.price || 0)
        trackEvent('RemoveFromCart', {
          value: priceNum,
          currency: (window as any).__CURRENCY_CODE__ || 'YER',
          content_ids: [String(it.id)],
          content_type: 'product_group',
          contents: [{ id: String(it.id), quantity: Number(it.qty || 1), item_price: priceNum }]
        })
      } catch { }
      this.saveLocal()
    },
    clear() { this.items = []; apiPost('/api/cart/clear', {}).catch(() => { }); this.saveLocal() },
    async update(uid: string, qty: number) {
      const it = this.items.find(i => i.uid === uid); if (!it) return
      it.qty = qty
      await apiPost('/api/cart/update', { productId: it.id, quantity: qty, attributes: { color: it.variantColor, size: it.variantSize, colorImageUrl: it.img } })
      // Pull authoritative quantities from server on cart page
      try { await this.syncFromServer(true) } catch { }
      this.saveLocal()
    }
  }
})