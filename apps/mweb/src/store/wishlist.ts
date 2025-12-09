import { defineStore } from 'pinia'
import { apiGet, apiPost } from '@/lib/api'

export type WishItem = {
  id: string;
  title: string;
  price: number;
  img: string;
  images?: string[];
  colorThumbs?: string[];
  colors?: string[];
  brand?: string;
  discountPercent?: number;
  basePrice?: number;
  soldPlus?: boolean;
  couponPrice?: number;
  overlayBannerSrc?: string;
  overlayBannerAlt?: string;
  slug?: string;
}

function load(): WishItem[] {
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]') } catch { return [] }
}
function save(items: WishItem[]) {
  try { localStorage.setItem('wishlist', JSON.stringify(items)) } catch { }
}

export const useWishlist = defineStore('wishlist', {
  state: () => ({ items: load() as WishItem[], loaded: false }),
  getters: {
    count: (s) => s.items.length,
    has: (s) => (id: string) => s.items.some(i => i.id === id)
  },
  actions: {
    async sync() {
      // Only sync if logged in (token exists)
      const { isAuthenticated } = await import('@/lib/api')
      if (!isAuthenticated()) return

      try {
        // 1. Fetch current server state
        const data = await apiGet<WishItem[]>('/api/auth/wishlist')
        const serverList = Array.isArray(data) ? data : []
        const serverIds = new Set(serverList.map(i => i.id))

        // 2. Identify local items NOT in server list (Guest items that need to be merged)
        const localOnly = this.items.filter(local => !serverIds.has(local.id))

        // 3. Push missing items to server
        // "toggle" removes if present, adds if missing. Since we verified they are missing, this adds them.
        if (localOnly.length > 0) {
          await Promise.all(localOnly.map(item =>
            apiPost('/api/auth/wishlist/toggle', { productId: item.id }).catch(() => { })
          ))
        }

        // 4. Update state to Union (Server + Newly Pushed Local Items)
        // We preserve server items + guarantee our local items are included
        this.items = [...serverList, ...localOnly]
        this.loaded = true
        save(this.items)
      } catch (e) { console.error('Wishlist sync failed', e) }
    },
    add(item: WishItem) {
      if (!this.items.some(i => i.id === item.id)) {
        this.items.push(item)
        save(this.items)

        // Sync with backend only if logged in
        import('@/lib/api').then(({ isAuthenticated }) => {
          if (isAuthenticated()) {
            apiPost('/api/auth/wishlist/toggle', { productId: item.id }).catch(() => { })
          }
        })

        // Track AddToWishlist
        try { import('@/lib/track').then(m => m.trackEvent('AddToWishlist', { content_ids: [String(item.id)], content_type: 'product_group', contents: [{ id: String(item.id), quantity: 1, item_price: Number((item as any).price || 0) }], value: Number((item as any).price || 0), currency: (window as any).__CURRENCY_CODE__ || 'YER' })) } catch { }
      }
    },
    remove(id: string) {
      this.items = this.items.filter(i => i.id !== id)
      save(this.items)

      // Sync with backend only if logged in
      import('@/lib/api').then(({ isAuthenticated }) => {
        if (isAuthenticated()) {
          apiPost('/api/auth/wishlist/toggle', { productId: id }).catch(() => { })
        }
      })

      // Track RemoveFromWishlist
      try { import('@/lib/track').then(m => m.trackEvent('RemoveFromWishlist', { content_ids: [String(id)], content_type: 'product_group' })) } catch { }
    },
    toggle(item: WishItem) {
      if (this.items.some(i => i.id === item.id)) this.remove(item.id)
      else this.add(item)
    }
  }
})

