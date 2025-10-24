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
    computeUid(productId: string, color?: string, size?: string){
      const c = String(color||'').trim().toLowerCase()
      const s = String(size||'').trim().toLowerCase()
      return `${productId}|${c}|${s}`
    },
    loadLocal(){
      try{ const j = localStorage.getItem('cart_v1'); if(j){ const arr = JSON.parse(j)||[]; if(Array.isArray(arr)) this.items = arr.map((it:any)=>{
        const id = String(it.id||'')
        const uid = it.uid || `${id}|${String(it.variantColor||'').trim().toLowerCase()}|${String(it.variantSize||'').trim().toLowerCase()}`
        return { ...it, id, uid }
      }) } }catch{}
    },
    saveLocal(){ try{ localStorage.setItem('cart_v1', JSON.stringify(this.items)) }catch{} },
    async syncFromServer(){
      // Preserve local variant metadata; only sync if cart is empty locally
      if (this.items.length > 0) { this.loaded = true; return }
      const data = await apiGet<any>('/api/cart')
      if (data && data.cart){
        this.items = (data.cart.items||[]).map((ci:any)=>{
          const id = String(ci.productId)
          const uid = this.computeUid(id)
          return { uid, id, title: ci.product?.name||ci.productId, price: Number(ci.product?.price||0), img: (ci.product?.images?.[0]||undefined), qty: ci.quantity }
        })
      }
      this.loaded = true
    },
    add(item: Omit<CartItem, 'qty'|'uid'>, qty = 1) {
      const uid = this.computeUid(item.id, item.variantColor, item.variantSize)
      const ex = this.items.find(i => i.uid === uid)
      if (ex) ex.qty += qty
      else this.items.push({ ...item, uid, qty })
      // fire and forget server sync
      apiPost('/api/cart/add', { productId: item.id, quantity: qty }).catch(()=>{})
      this.saveLocal()
    },
    upsertVariantMeta(uid: string, meta: { color?: string; size?: string; img?: string }){
      const it = this.items.find(i=> i.uid===uid)
      if (!it) return
      if (typeof meta.color==='string') it.variantColor = meta.color
      if (typeof meta.size==='string') it.variantSize = meta.size
      if (typeof meta.img==='string' && meta.img) it.img = meta.img
      // recompute uid; merge if another item matches new uid
      const newUid = this.computeUid(it.id, it.variantColor, it.variantSize)
      if (newUid !== it.uid){
        const other = this.items.find(x=> x.uid===newUid)
        if (other){ other.qty += it.qty; this.items = this.items.filter(x=> x!==it) }
        else { it.uid = newUid }
      }
      this.saveLocal()
    },
    remove(uid: string) {
      const it = this.items.find(i=> i.uid===uid)
      if (!it) return
      this.items = this.items.filter(i => i.uid !== uid)
      apiPost('/api/cart/remove', { productId: it.id }).catch(()=>{})
      this.saveLocal()
    },
    clear() { this.items = []; apiPost('/api/cart/clear', {}).catch(()=>{}); this.saveLocal() },
    async update(uid: string, qty: number){
      const it = this.items.find(i=>i.uid===uid); if(!it) return
      it.qty = qty
      await apiPost('/api/cart/update', { productId: it.id, quantity: qty })
      this.saveLocal()
    }
  }
})