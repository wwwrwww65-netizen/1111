<template>
  <div dir="rtl" lang="ar">
    <HeaderBar />
    <div class="page">
      <div class="search-area">
        <button class="clear" aria-label="مسح" @click="clearAll">🗑</button>
        <div class="search-pill" role="search">
          <button class="back" aria-label="رجوع">←</button>
          <input class="s-input" v-model="q" :placeholder="placeholder" @keyup.enter="runSearch" aria-label="بحث" />
          <button class="cam" aria-label="بحث بالصور" @click="openImagePicker">📷</button>
          <button class="search-icon" aria-label="بحث" @click="runSearch">🔍</button>
        </div>
      </div>

      <section class="chips" aria-label="البحث الأخير" v-if="historyList.length">
        <button v-for="(t,i) in visibleHistory" :key="t" class="chip" role="button" @click="applyQuick(t)">{{ t }}</button>
        <button v-if="historyList.length>maxHistory" class="chip more" @click="toggleHistory">{{ showAllHistory? 'أقل' : 'المزيد' }} ▾</button>
      </section>

      <section class="chips tags" aria-label="البحث والعثور" v-if="tags.length">
        <button v-for="t in tags" :key="t" class="chip" role="button" @click="applyQuick(t)">{{ t }}</button>
      </section>

      <section class="cards-grid" v-if="!q">
        <div class="ranking-card" v-for="(card,ci) in ranking" :key="ci">
          <div class="card-header"><span class="top-badge">TOP</span><span class="hdr-title">{{ card.title }}</span></div>
          <div class="card-body">
            <div v-for="(it,ri) in card.items" :key="ri" class="rank-row" role="button" @click="applyQuick(it.title)">
              <div class="rank-badge" :style="{ background: rankColor(ri+1) }">{{ ri+1 }}</div>
              <img class="item-thumb" :src="it.img" :alt="it.title" loading="lazy" />
              <div class="txt">
                <div class="item-title">{{ it.title }}<span v-if="it.isNew" class="new-tag">جديد</span></div>
                <div class="sub">{{ it.sub }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="items.length" class="results">
        <div class="grid">
          <ProductCard v-for="p in items" :key="p.id" :img="p.img" :title="p.title" :price="p.price + ' ر.س'" :afterCoupon="p.after" :discountPercent="p.off" :soldCount="p.sold" :isFastShipping="p.fast" />
        </div>
      </section>
      <div v-else class="muted" v-if="searched">لا توجد نتائج</div>

      <div class="footer-note">يتم تحديث عمليات البحث الشائعة يوميًا بناءً على نشاط المستخدم.</div>
    </div>

    <BottomSheet v-model="openFilters">
      <div class="sheet-title">الفلاتر</div>
      <div class="filter-block">
        <div class="block-title">السعر</div>
        <div class="row">
          <input class="input" type="number" v-model.number="priceMin" placeholder="من" />
          <input class="input" type="number" v-model.number="priceMax" placeholder="إلى" />
        </div>
      </div>
      <button class="btn" @click="runSearch">تطبيق</button>
    </BottomSheet>

    <BottomNav />
  </div>
  </template>

<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue'
import BottomNav from '@/components/BottomNav.vue'
import BottomSheet from '@/components/BottomSheet.vue'
import ProductCard from '@/components/ProductCard.vue'
import { ref, computed } from 'vue'
import { API_BASE } from '@/lib/api'

type P = { id:string; title:string; price:number; img:string }
const q = ref('')
let t: any
const placeholder = 'أنماط مريحة لخريف وشتاء'
const items = ref<P[]>([])
const openFilters = ref(false)
const priceMin = ref<number|undefined>()
const priceMax = ref<number|undefined>()
const searched = ref(false)
const trending = ['فساتين','أحذية','ساعات','سماعات','ملابس رياضية']
const historyList = JSON.parse(localStorage.getItem('search_history')||'[]') as string[]
const showAllHistory = ref(false)
const maxHistory = 8
const visibleHistory = computed(()=> showAllHistory.value ? historyList : historyList.slice(0, maxHistory))
function toggleHistory(){ showAllHistory.value = !showAllHistory.value }
const tags = ['شتاء','مريح','قطن','صحي','الجمال','رياضة','ذكي','هواتف']
function saveHistory(term:string){
  const list = Array.from(new Set([term, ...historyList])).slice(0,10)
  localStorage.setItem('search_history', JSON.stringify(list))
}
function applyQuick(term:string){ q.value = term; runSearch() }
function clearAll(){ q.value=''; items.value=[]; searched.value=false }
function openImagePicker(){ /* hook to open image search */ }
type RankItem = { title:string; sub:string; img:string; isNew?: boolean }
const ranking = ref<Array<{ title:string; items: RankItem[] }>>([
  { title: 'عمليات البحث الشائعة', items: Array.from({length:6}).map((_,i)=>({ title:`كلمة ${i+1}`, sub:'#ترند', img:`https://picsum.photos/seed/sr${i}/96/96`, isNew: i%3===0 })) },
  { title: 'الصحة & الجمال', items: Array.from({length:6}).map((_,i)=>({ title:`جمال ${i+1}`, sub:'مستحضرات', img:`https://picsum.photos/seed/hb${i}/96/96` })) }
])
function rankColor(n:number){ if(n===1) return '#FFD166'; if(n===2) return '#A8DADC'; if(n===3) return '#F6C8A8'; return '#E9E9E9' }
async function runSearch(){
  searched.value = true
  if(q.value.trim()) saveHistory(q.value.trim())
  const sp = new URLSearchParams({ q: q.value })
  if(priceMin.value!=null) sp.set('min', String(priceMin.value))
  if(priceMax.value!=null) sp.set('max', String(priceMax.value))
  try{
    const res = await fetch(`${API_BASE}/api/search?${sp.toString()}`, { credentials:'omit', headers:{ 'Accept':'application/json' } })
    if(res.ok){
      const data = await res.json()
      items.value = (data?.items||[]).map((d:any)=>({ id:d.id||d.sku||String(d.name), title:d.name, price:d.price||0, img:(d.images?.[0]||'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1080&auto=format&fit=crop') }))
      if(items.value.length) return
    }
  }catch{}
  items.value = Array.from({length:6}).map((_,i)=>({ id:String(i+1), title:`${q.value||'منتج'} ${i+1}`, price: 49 + i*7, img:'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1080&auto=format&fit=crop', off: i%2?10:0, sold: 120+i, fast: i%3===0, after: i%2? `SR ${(49+i*7-3).toFixed(2)}`: '' }))
}

// suggestions (debounced)
const suggestions = ref<string[]>([])
watch(q, (nv)=>{
  clearTimeout(t); t = setTimeout(async ()=>{
    if (!nv.trim()) { suggestions.value = []; return }
    try{ const r = await fetch(`${API_BASE}/api/search/suggest?q=${encodeURIComponent(nv)}`, { credentials:'omit' }); if(r.ok){ const j = await r.json(); suggestions.value = Array.isArray(j?.items)? j.items : [] } }catch{ suggestions.value = [] }
  }, 220)
})
</script>

<style scoped>
.page{padding:12px 16px;padding-top:68px;background:#fff}
.search-area{position:relative;margin-bottom:12px}
.clear{position:absolute;top:-10px;inset-inline-end:0;width:24px;height:24px;border:0;background:transparent}
.search-pill{height:56px;display:flex;align-items:center;gap:12px;padding:0 12px;border-radius:28px;border:1px solid #EAEAEA}
.back{width:36px;height:36px;border-radius:18px;border:0;background:transparent}
.s-input{flex:1;border:0;outline:0;font-size:16px;color:#222}
.cam{width:36px;height:36px;border-radius:8px;border:0;background:#F3F3F3}
.search-icon{width:48px;height:48px;border-radius:24px;background:#111;color:#fff;border:0;display:flex;align-items:center;justify-content:center}
.chips{display:flex;flex-wrap:wrap;gap:8px 8px;margin:12px 0}
.chip{height:36px;padding:0 12px;border-radius:18px;background:#F3F3F3;display:inline-flex;align-items:center;font-size:14px;color:#222;border:1px solid #F3F3F3}
.chip.more{background:#fff;border-color:#EAEAEA}
.tags{row-gap:16px}
.cards-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:16px}
.ranking-card{background:#fff;border-radius:10px;border:1px solid #F0EDEA;overflow:hidden}
.card-header{height:56px;display:flex;align-items:center;gap:8px;padding:0 12px;background:linear-gradient(90deg,#FFECEE,#FFF6F6);font-weight:700}
.top-badge{background:#fff;border:1px solid #F0EDEA;border-radius:6px;padding:2px 6px;font-size:12px}
.hdr-title{margin-inline-start:6px}
.card-body{padding:6px 0}
.rank-row{display:flex;align-items:center;gap:10px;padding:8px 12px;min-height:52px;border-bottom:1px solid #F3F3F3}
.rank-badge{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px}
.item-thumb{width:48px;height:48px;border-radius:6px;object-fit:cover;background:#f3f3f3}
.txt{display:flex;flex-direction:column}
.item-title{font-size:14px;font-weight:600;color:#222}
.sub{font-size:12px;color:#777}
.new-tag{background:#DFF3E4;padding:2px 6px;border-radius:6px;font-size:11px;margin-inline-start:8px}
.results{margin-top:12px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.muted{color:#64748b;margin-top:12px}
.sheet-title{font-weight:700;margin-bottom:8px}
.footer-note{font-size:12px;color:#9A9A9A;text-align:center;margin:18px 0}
</style>
