import { defineStore } from 'pinia'
import { apiGet, apiPost } from '@/lib/api'

export type CartItem = { id: string; title: string; price: number; img?: string; qty: number }

export const useCart = defineStore('cart', {
  state: () => ({ items: [] as CartItem[], loaded: false }),
  getters: {
    count: (s) => s.items.reduce((n, i) => n + i.qty, 0),
    total: (s) => s.items.reduce((n, i) => n + i.qty * i.price, 0)
  },
  actions: {
    loadLocal(){
      try{ const j = localStorage.getItem('cart_v1'); if(j){ const arr = JSON.parse(j)||[]; if(Array.isArray(arr)) this.items = arr } }catch{}
    },
    saveLocal(){ try{ localStorage.setItem('cart_v1', JSON.stringify(this.items)) }catch{} },
    async syncFromServer(){
      const data = await apiGet<any>('/api/cart')
      if (data && data.cart){
        this.items = (data.cart.items||[]).map((ci:any)=>({ id: ci.productId, title: ci.product?.name||ci.productId, price: Number(ci.product?.price||0), img: (ci.product?.images?.[0]||undefined), qty: ci.quantity }))
      }
      this.loaded = true
    },
    add(item: Omit<CartItem, 'qty'>, qty = 1) {
      const ex = this.items.find(i => i.id === item.id)
      if (ex) ex.qty += qty
      else this.items.push({ ...item, qty })
      // fire and forget server sync
      apiPost('/api/cart/add', { productId: item.id, quantity: qty }).catch(()=>{})
      this.saveLocal()
    },
    remove(id: string) { this.items = this.items.filter(i => i.id !== id); apiPost('/api/cart/remove', { productId: id }).catch(()=>{}); this.saveLocal() },
    clear() { this.items = []; apiPost('/api/cart/clear', {}).catch(()=>{}); this.saveLocal() },
    async update(id: string, qty: number){
      const it = this.items.find(i=>i.id===id); if(!it) return
      it.qty = qty
      await apiPost('/api/cart/update', { productId: id, quantity: qty })
      this.saveLocal()
    }
  }
})