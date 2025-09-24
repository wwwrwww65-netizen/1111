<template>
  <div class="page" dir="rtl" lang="ar">
    <!-- Status bar -->
    <div class="status">
      <div class="l">
        <span>11:02</span>
        <span>%81</span>
        <div class="bat"><i style="width:75%"></i></div>
      </div>
      <div class="r">
        <div class="dots"><i>S</i><i>S</i><i>S</i></div>
      </div>
    </div>

    <!-- Header -->
    <header class="hdr">
      <div class="grp">
        <Icon name="heart" />
        <button class="sbtn"><Icon name="search" color="#fff" /></button>
        <Icon name="camera" />
      </div>
      <div class="grp">
        <span class="lbl">البحث</span>
        <div class="mail"><Icon name="mail" /><em></em></div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="tabs">
      <button :class="{on: active==='all'}" @click="setTab('all')">كل</button>
      <button @click="setTab('women')">نساء</button>
      <button @click="setTab('kids')">أطفال</button>
      <button @click="setTab('men')">رجال</button>
      <button @click="setTab('plus')">مقاسات كبيرة</button>
      <button class="sm" @click="setTab('home')">المنزل + الحيوانات</button>
    </nav>

    <div class="layout">
      <!-- Sidebar -->
      <aside class="side">
        <div class="it" v-for="(s,i) in sidebarItems" :key="i">{{ s }}</div>
      </aside>

      <!-- Main grid -->
      <main class="main">
        <h2 class="ttl">مختارات من أجلك</h2>
        <div class="grid">
          <a v-for="c in cats" :key="c.id" class="cell" :href="`/c/${encodeURIComponent(c.id)}`">
            <img :src="c.image" :alt="c.name" />
            <div class="name">{{ c.name }}</div>
          </a>
        </div>

        <h3 class="ttl2">ربما يعجبك هذا أيضاً</h3>
        <div class="grid small">
          <div class="cell"><img src="https://csspicker.dev/api/image/?q=fashion+accessories&image_type=photo" alt="إكسسوارات" /></div>
          <div class="cell"><img src="https://csspicker.dev/api/image/?q=kids+clothing&image_type=photo" alt="ملابس أطفال" /></div>
          <div class="cell"><img src="https://csspicker.dev/api/image/?q=sports+equipment&image_type=photo" alt="معدات رياضية" /></div>
        </div>
      </main>
    </div>

    <BottomNav active="categories" />
  </div>
  
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import Icon from '@/components/Icon.vue'
import { ref, onMounted } from 'vue'
import { apiGet } from '@/lib/api'
type Cat = { id:string; name:string; image:string }
const cats = ref<Cat[]>([])
const active = ref('all')
function setTab(v:string){ active.value = v }
const sidebarItems = [
  'لأحلامكم فقط','جديد في','تخفيض الأسعار','ملابس نسائية','إلكترونيات','أحذية','الملابس الرجالية','الأطفال','المنزل والمطبخ','ملابس داخلية، وملابس نوم','مقاسات كبيرة','مجوهرات وإكسسوارات','الأطفال والأمومة','الرياضة والأنشطة الخارجية'
]
onMounted(async ()=>{
  const data = await apiGet<any>('/api/categories?limit=36')
  if (data && Array.isArray(data.categories)){
    cats.value = data.categories.map((c:any)=>({ id: c.slug||c.id, name:c.name, image:c.image || `https://picsum.photos/seed/${encodeURIComponent(c.slug||c.id)}/200/200` }))
  } else {
    cats.value = Array.from({ length: 12 }).map((_,i)=>({ id:String(i+1), name:`فئة ${i+1}`, image:`https://picsum.photos/seed/cat${i}/200/200` }))
  }
})
</script>

<style scoped>
.page{min-height:100dvh;background:#f9fafb}
.status{display:flex;align-items:center;justify-content:space-between;background:#fff;padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#4b5563}
.status .l{display:flex;align-items:center;gap:6px}
.bat{width:22px;height:10px;border:1px solid #9ca3af;border-radius:2px;position:relative;overflow:hidden}
.bat i{display:block;height:100%;background:#22c55e}
.dots{display:flex;gap:4px}
.dots i{width:12px;height:12px;background:#111;border-radius:3px;display:grid;place-items:center;color:#fff;font-size:9px}

.hdr{background:#fff;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #eee}
.grp{display:flex;align-items:center;gap:10px}
.sbtn{width:36px;height:36px;border-radius:10px;background:#111;display:grid;place-items:center;border:0}
.lbl{color:#4b5563}
.mail{position:relative}
.mail em{position:absolute;top:-4px;inset-inline-end:-4px;width:10px;height:10px;border-radius:999px;background:#ef4444}

.tabs{background:#fff;display:flex;align-items:center;gap:16px;padding:10px 12px;border-bottom:1px solid #eee}
.tabs button{background:transparent;border:0;color:#6b7280}
.tabs .on{color:#111;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px}
.tabs .sm{font-size:12px}

.layout{display:grid;grid-template-columns:160px 1fr;min-height:0}
.side{background:#f3f4f6;padding:12px;min-height:calc(100dvh - 160px)}
.side .it{padding:8px 0;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px}
.main{padding:12px}
.ttl{text-align:center;font-weight:700;margin:12px 0}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.grid.small .cell{aspect-ratio:1/1}
.cell{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:inherit}
.cell img{width:80px;height:80px;border-radius:999px;object-fit:cover;background:#e5e7eb}
.name{font-size:12px;color:#374151;margin-top:6px;line-height:1.2;text-align:center}

@media (max-width: 768px){
  .layout{grid-template-columns:120px 1fr}
}
@media (max-width: 520px){
  .layout{grid-template-columns:96px 1fr}
  .grid{grid-template-columns:repeat(3,1fr)}
  .cell img{width:72px;height:72px}
}
</style>

