import { defineStore } from 'pinia'

export type WishItem = { id: string; title: string; price: number; img: string }

function load(): WishItem[] {
  try { return JSON.parse(localStorage.getItem('wishlist') || '[]') } catch { return [] }
}
function save(items: WishItem[]) {
  try { localStorage.setItem('wishlist', JSON.stringify(items)) } catch {}
}

export const useWishlist = defineStore('wishlist', {
  state: () => ({ items: load() as WishItem[] }),
  getters: {
    count: (s) => s.items.length,
    has: (s) => (id: string) => s.items.some(i => i.id === id)
  },
  actions: {
    add(item: WishItem) {
      if (!this.items.some(i => i.id === item.id)) {
        this.items.push(item)
        save(this.items)
      }
    },
    remove(id: string) {
      this.items = this.items.filter(i => i.id !== id)
      save(this.items)
    },
    toggle(item: WishItem) {
      if (this.items.some(i => i.id === item.id)) this.remove(item.id)
      else this.add(item)
    }
  }
})

