import { defineStore } from 'pinia'

export type CartItem = { id: string; title: string; price: number; img?: string; qty: number }

export const useCart = defineStore('cart', {
  state: () => ({ items: [] as CartItem[] }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.qty * i.price, 0)
  },
  actions: {
    add(item: Omit<CartItem, 'qty'>, qty = 1) {
      const ex = this.items.find(i => i.id === item.id)
      if (ex) ex.qty += qty
      else this.items.push({ ...item, qty })
    },
    remove(id: string) { this.items = this.items.filter(i => i.id !== id) },
    clear() { this.items = [] }
  }
})