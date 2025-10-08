<template>
  <div class="page" dir="rtl" lang="ar">
    <!-- Promo Popup -->
    <div v-if="showPromoPopup" class="popup-overlay" @click="closePopup">
      <div class="popup-content" @click.stop>
        <button class="popup-close" @click="closePopup" aria-label="إغلاق">×</button>
        <div class="popup-body">
          <h2 class="popup-title">سجل واحصل على</h2>
          <div class="popup-discount">
            <span class="discount-percent">%15</span>
            <span class="discount-text">خصم إضافي</span>
          </div>
          <div class="popup-subtitle">الدفع عند الاستلام للطلبات +75₪</div>
          <input type="email" class="popup-input" placeholder="أدخلي عنوان بريدك الإلكتروني" v-model="promoEmail" />
          <button class="popup-btn" @click="subscribePromo">تسجيل</button>
          <p class="popup-terms">بالتسجيل، فإنك توافق على سياسة الخصوصية ونلتزم بالشروط والأحكام الخاصة بنا.</p>
      </div>
      </div>
    </div>

    <!-- Header -->
    <div class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm h-14" aria-label="رأس الصفحة">
      <div class="w-screen px-3 h-full flex items-center justify-between">
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="الإشعارات" @click="go('/notifications')">
            <Bell class="text-gray-800 w-6 h-6" />
          </button>
        </div>
        <div class="text-lg sm:text-xl font-semibold text-gray-900" aria-label="شعار المتجر">jeeey</div>
        <div class="flex items-center gap-1">
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="السلة" @click="go('/cart')">
            <ShoppingCart class="text-gray-800 w-6 h-6" />
          </button>
          <button class="w-11 h-11 flex items-center justify-center rounded-[4px]" aria-label="البحث" @click="go('/search')">
            <Search class="text-gray-800 w-6 h-6" />
          </button>
        </div>
      </div>
      </div>

    <!-- Tabs (ملتصقة بالهيدر) -->
    <nav class="tabs fixed left-0 right-0 z-40 bg-white border-t border-b border-gray-200" style="top: 50px;">
      <button :class="{on: active==='all'}" @click="setTab('all')">كل</button>
      <button :class="{on: active==='women'}" @click="setTab('women')">نساء</button>
      <button :class="{on: active==='kids'}" @click="setTab('kids')">أطفال</button>
      <button :class="{on: active==='men'}" @click="setTab('men')">رجال</button>
      <button :class="{on: active==='plus'}" @click="setTab('plus')">مقاسات كبيرة</button>
      <button class="sm" :class="{on: active==='home'}" @click="setTab('home')">المنزل + الحيوانات الأليفة</button>
      <button :class="{on: active==='beauty'}" @click="setTab('beauty')">تجميل</button>
    </nav>

    <div class="layout">
      <!-- Sidebar -->
      <aside class="side">
        <button 
          class="it" 
          v-for="(item,i) in sidebarItems" 
          :key="i" 
          type="button" 
          @click="applySide(item)"
          :class="{active: selectedSidebarItem === item.label}"
        >
          {{ item.label }}
        </button>
      </aside>

      <!-- Main grid -->
      <main class="main">
        <!-- Promo Banner -->
        <div class="promo-banner" v-if="active === 'all'">
          <div class="promo-content">
            <h3>جديد ملابس النساء</h3>
            <img src="https://csspicker.dev/api/image/?q=women+fashion+banner&image_type=photo" alt="بانر ترويجي" class="promo-img" />
          </div>
        </div>

        <h2 class="ttl">{{ currentSectionTitle }}</h2>
        
        <!-- Featured Categories with subcategories -->
        <div v-if="showFeaturedSection && featuredCategories.length > 0" class="featured-section">
          <div class="subcategories-scroll">
            <button 
              v-for="sub in featuredCategories" 
              :key="sub.id" 
              class="subcat-btn"
              @click="selectSubcategory(sub.id)"
            >
              {{ sub.name }}
            </button>
          </div>
        </div>

        <SkeletonGrid v-if="loading" :count="12" :cols="3" />
        <div v-else class="grid">
          <a v-for="c in displayedCategories" :key="c.id" class="cell" :href="`/c/${encodeURIComponent(c.id)}`" @click="trackCategoryClick(c)">
            <img :src="c.image" :alt="c.name" loading="lazy" />
            <div class="name">{{ c.name }}</div>
            <div v-if="c.badge" class="badge">{{ c.badge }}</div>
          </a>
        </div>

        <!-- Suggestions Section -->
        <h3 class="ttl2">ربما يعجبك هذا أيضاً</h3>
        <div class="grid suggestions">
          <a 
            v-for="(sug, idx) in suggestions" 
            :key="idx" 
            class="cell"
            :href="`/c/${encodeURIComponent(sug.id)}`"
            @click="trackSuggestionClick(sug)"
          >
            <img :src="sug.image" :alt="sug.name" loading="lazy" />
            <div class="name">{{ sug.name }}</div>
          </a>
        </div>
      </main>
    </div>

    <BottomNav active="categories" />
  </div>
  
</template>

<script setup lang="ts">
import BottomNav from '@/components/BottomNav.vue'
import Icon from '@/components/Icon.vue'
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/lib/api'
import { Bell, ShoppingCart, Search } from 'lucide-vue-next'

// Types
type Cat = { 
  id: string
  name: string
  image: string
  badge?: string
  categoryType?: string
  subcategories?: Cat[]
  parent?: string
}

type SidebarItem = {
  label: string
  icon?: string
  tab?: string
}

// State
const cats = ref<Cat[]>([])
const loading = ref(true)
const active = ref('all')
const selectedSidebarItem = ref('')
const selectedSubcategory = ref<string | null>(null)
const showPromoPopup = ref(false)
const promoEmail = ref('')

const router = useRouter()
function go(path: string) { router.push(path) }

// Enhanced Sidebar with icons
const sidebarItems: SidebarItem[] = [
  { label: 'لأحلامكم فقط', icon: '✨' },
  { label: 'جديد في', icon: '🆕', tab: 'all' },
  { label: 'تخفيض الأسعار', icon: '🔥' },
  { label: 'ملابس نسائية', icon: '👗', tab: 'women' },
  { label: 'إلكترونيات', icon: '📱' },
  { label: 'أحذية', icon: '👟' },
  { label: 'الملابس الرجالية', icon: '👔', tab: 'men' },
  { label: 'الأطفال', icon: '👶', tab: 'kids' },
  { label: 'المنزل والمطبخ', icon: '🏠', tab: 'home' },
  { label: 'ملابس داخلية، وملابس نوم', icon: '🛏️' },
  { label: 'مقاسات كبيرة', icon: '➕', tab: 'plus' },
  { label: 'مجوهرات وإكسسوارات', icon: '💎' },
  { label: 'الأطفال والأمومة', icon: '🍼' },
  { label: 'الرياضة والأنشطة الخارجية', icon: '⚽' },
  { label: 'الصحة والجمال', icon: '💄', tab: 'beauty' },
  { label: 'الحقائب والأمتعة', icon: '👜' },
  { label: 'منسوجات منزلية', icon: '🛋️' },
  { label: 'هواتف خليوية وإكسسوارات', icon: '📱' },
  { label: 'الألعاب', icon: '🎮' },
  { label: 'أدوات وتحسين المنزل', icon: '🔧' },
  { label: 'مستلزمات مكتبية ومدرسية', icon: '📚' },
  { label: 'أجهزة', icon: '⚙️' },
  { label: 'السيارات', icon: '🚗' },
  { label: 'مستلزمات الحيوانات الأليفة', icon: '🐾' }
]

// Hierarchical category structure
const categoryHierarchy: Record<string, Cat[]> = {
  women: [
    { id: 'women-new', name: 'الجديد في', image: 'https://csspicker.dev/api/image/?q=new+women+fashion&image_type=photo', badge: 'جديد' },
    { id: 'women-dresses', name: 'فساتين', image: 'https://csspicker.dev/api/image/?q=dresses&image_type=photo' },
    { id: 'women-long-dresses', name: 'فساتين طويلة', image: 'https://csspicker.dev/api/image/?q=long+dresses&image_type=photo' },
    { id: 'women-tops', name: 'ملابس علوية', image: 'https://csspicker.dev/api/image/?q=women+tops&image_type=photo' },
    { id: 'women-tshirts', name: 'تي شيرتات', image: 'https://csspicker.dev/api/image/?q=women+tshirts&image_type=photo' },
    { id: 'women-blouses', name: 'بلايز', image: 'https://csspicker.dev/api/image/?q=blouses&image_type=photo' },
    { id: 'women-bottoms', name: 'ملابس سفلية', image: 'https://csspicker.dev/api/image/?q=women+bottoms&image_type=photo' },
    { id: 'women-skirts', name: 'تنانير', image: 'https://csspicker.dev/api/image/?q=skirts&image_type=photo' },
    { id: 'women-pants', name: 'بناطيل', image: 'https://csspicker.dev/api/image/?q=women+pants&image_type=photo' },
    { id: 'women-knits', name: 'منسوجة', image: 'https://csspicker.dev/api/image/?q=knit+wear&image_type=photo' },
    { id: 'women-sweaters', name: 'سويترات', image: 'https://csspicker.dev/api/image/?q=sweaters&image_type=photo' },
    { id: 'women-sets', name: 'أطقم منسقة', image: 'https://csspicker.dev/api/image/?q=matching+sets&image_type=photo' }
  ],
  men: [
    { id: 'men-new', name: 'جديد رجالي', image: 'https://csspicker.dev/api/image/?q=men+fashion+new&image_type=photo', badge: 'جديد' },
    { id: 'men-shirts', name: 'قمصان', image: 'https://csspicker.dev/api/image/?q=men+shirts&image_type=photo' },
    { id: 'men-tshirts', name: 'تيشيرتات', image: 'https://csspicker.dev/api/image/?q=men+tshirts&image_type=photo' },
    { id: 'men-pants', name: 'بناطيل', image: 'https://csspicker.dev/api/image/?q=men+pants&image_type=photo' },
    { id: 'men-hoodies', name: 'هوديز', image: 'https://csspicker.dev/api/image/?q=men+hoodies&image_type=photo' },
    { id: 'men-jackets', name: 'جاكيتات', image: 'https://csspicker.dev/api/image/?q=men+jackets&image_type=photo' },
    { id: 'men-shoes', name: 'أحذية رجالية', image: 'https://csspicker.dev/api/image/?q=men+shoes&image_type=photo' },
    { id: 'men-accessories', name: 'إكسسوارات رجالية', image: 'https://csspicker.dev/api/image/?q=men+accessories&image_type=photo' }
  ],
  kids: [
    { id: 'kids-new', name: 'جديد أطفال', image: 'https://csspicker.dev/api/image/?q=kids+fashion+new&image_type=photo', badge: 'جديد' },
    { id: 'kids-girls', name: 'ملابس بنات', image: 'https://csspicker.dev/api/image/?q=girls+clothing&image_type=photo' },
    { id: 'kids-boys', name: 'ملابس أولاد', image: 'https://csspicker.dev/api/image/?q=boys+clothing&image_type=photo' },
    { id: 'kids-baby', name: 'ملابس رضع', image: 'https://csspicker.dev/api/image/?q=baby+clothing&image_type=photo' },
    { id: 'kids-shoes', name: 'أحذية أطفال', image: 'https://csspicker.dev/api/image/?q=kids+shoes&image_type=photo' },
    { id: 'kids-toys', name: 'ألعاب', image: 'https://csspicker.dev/api/image/?q=kids+toys&image_type=photo' }
  ],
  plus: [
    { id: 'plus-women', name: 'مقاسات كبيرة نساء', image: 'https://csspicker.dev/api/image/?q=plus+size+women&image_type=photo' },
    { id: 'plus-men', name: 'مقاسات كبيرة رجال', image: 'https://csspicker.dev/api/image/?q=plus+size+men&image_type=photo' },
    { id: 'plus-dresses', name: 'فساتين واسعة', image: 'https://csspicker.dev/api/image/?q=plus+size+dresses&image_type=photo' },
    { id: 'plus-activewear', name: 'ملابس رياضية', image: 'https://csspicker.dev/api/image/?q=plus+size+activewear&image_type=photo' }
  ],
  home: [
    { id: 'home-decor', name: 'ديكور منزلي', image: 'https://csspicker.dev/api/image/?q=home+decor&image_type=photo' },
    { id: 'home-kitchen', name: 'أدوات مطبخ', image: 'https://csspicker.dev/api/image/?q=kitchen+tools&image_type=photo' },
    { id: 'home-bedding', name: 'مفروشات', image: 'https://csspicker.dev/api/image/?q=bedding&image_type=photo' },
    { id: 'home-pets', name: 'مستلزمات حيوانات', image: 'https://csspicker.dev/api/image/?q=pet+supplies&image_type=photo' },
    { id: 'home-storage', name: 'تخزين وتنظيم', image: 'https://csspicker.dev/api/image/?q=storage+organization&image_type=photo' }
  ],
  beauty: [
    { id: 'beauty-makeup', name: 'مكياج', image: 'https://csspicker.dev/api/image/?q=makeup&image_type=photo' },
    { id: 'beauty-skincare', name: 'العناية بالبشرة', image: 'https://csspicker.dev/api/image/?q=skincare&image_type=photo' },
    { id: 'beauty-haircare', name: 'العناية بالشعر', image: 'https://csspicker.dev/api/image/?q=haircare&image_type=photo' },
    { id: 'beauty-fragrance', name: 'عطور', image: 'https://csspicker.dev/api/image/?q=perfume&image_type=photo' },
    { id: 'beauty-nails', name: 'العناية بالأظافر', image: 'https://csspicker.dev/api/image/?q=nail+care&image_type=photo' },
    { id: 'beauty-tools', name: 'أدوات تجميل', image: 'https://csspicker.dev/api/image/?q=beauty+tools&image_type=photo' }
  ]
}

// Suggestions data
const suggestions = ref<Cat[]>([
  { id: 'sug-accessories', name: 'إكسسوارات عصرية', image: 'https://csspicker.dev/api/image/?q=fashion+accessories&image_type=photo' },
  { id: 'sug-kids', name: 'ملابس أطفال مريحة', image: 'https://csspicker.dev/api/image/?q=kids+comfortable+clothing&image_type=photo' },
  { id: 'sug-sports', name: 'معدات رياضية', image: 'https://csspicker.dev/api/image/?q=sports+equipment&image_type=photo' },
  { id: 'sug-bags', name: 'حقائب أنيقة', image: 'https://csspicker.dev/api/image/?q=stylish+bags&image_type=photo' },
  { id: 'sug-shoes', name: 'أحذية مريحة', image: 'https://csspicker.dev/api/image/?q=comfortable+shoes&image_type=photo' },
  { id: 'sug-jewelry', name: 'مجوهرات', image: 'https://csspicker.dev/api/image/?q=jewelry&image_type=photo' }
])

// Tab management
function setTab(v: string) { 
  active.value = v
  selectedSubcategory.value = null
  trackTabChange(v)
}

// Sidebar management
function applySide(item: SidebarItem) {
  selectedSidebarItem.value = item.label
  if (item.tab) {
    setTab(item.tab)
  }
  trackSidebarClick(item.label)
}

// Featured categories (subcategories for current tab)
const featuredCategories = computed(() => {
  if (active.value === 'all') return []
  return categoryHierarchy[active.value] || []
})

const showFeaturedSection = computed(() => {
  return active.value !== 'all' && featuredCategories.value.length > 0
})

// Select subcategory
function selectSubcategory(id: string) {
  selectedSubcategory.value = selectedSubcategory.value === id ? null : id
  trackSubcategoryClick(id)
}

// Enhanced filtering with hierarchical support
const displayedCategories = computed(() => {
  // If a specific subcategory is selected, show only that
  if (selectedSubcategory.value) {
    return featuredCategories.value.filter(c => c.id === selectedSubcategory.value)
  }
  
  // If a tab is selected, show its categories
  if (active.value !== 'all') {
    return categoryHierarchy[active.value] || []
  }
  
  // Otherwise show all categories from API or fallback
  return cats.value
})

// Section title
const currentSectionTitle = computed(() => {
  const titles: Record<string, string> = {
    all: 'مختارات من أجلك',
    women: 'ملابس نسائية',
    men: 'ملابس رجالية',
    kids: 'ملابس أطفال',
    plus: 'مقاسات كبيرة',
    home: 'المنزل والحيوانات الأليفة',
    beauty: 'منتجات التجميل'
  }
  return titles[active.value] || 'مختارات من أجلك'
})

// Promo popup management
function closePopup() {
  showPromoPopup.value = false
  trackPopupClose()
}

function subscribePromo() {
  if (promoEmail.value) {
    trackPromoSubscription(promoEmail.value)
    // In production: send to API
    console.log('Subscribed:', promoEmail.value)
    closePopup()
  }
}

// Analytics/Tracking functions
function trackTabChange(tab: string) {
  console.log('[Analytics] Tab changed to:', tab)
  // In production: send to analytics service
}

function trackSidebarClick(label: string) {
  console.log('[Analytics] Sidebar clicked:', label)
}

function trackSubcategoryClick(id: string) {
  console.log('[Analytics] Subcategory clicked:', id)
}

function trackCategoryClick(category: Cat) {
  console.log('[Analytics] Category clicked:', category.name)
}

function trackSuggestionClick(suggestion: Cat) {
  console.log('[Analytics] Suggestion clicked:', suggestion.name)
}

function trackPopupClose() {
  console.log('[Analytics] Popup closed')
}

function trackPromoSubscription(email: string) {
  console.log('[Analytics] Promo subscription:', email)
}

// Load categories
onMounted(async () => {
  const data = await apiGet<any>('/api/categories?limit=36')
  if (data && Array.isArray(data.categories)) {
    cats.value = data.categories.map((c: any) => ({ 
      id: c.slug || c.id, 
      name: c.name, 
      image: c.image || `https://picsum.photos/seed/${encodeURIComponent(c.slug || c.id)}/200/200`,
      categoryType: c.categoryType
    }))
  } else {
    // Fallback with mixed categories
    cats.value = [
      ...Array.from({ length: 6 }).map((_, i) => ({ 
        id: `women-${i}`, 
        name: `فئة نسائية ${i + 1}`, 
        image: `https://csspicker.dev/api/image/?q=women+fashion+${i}&image_type=photo`,
        categoryType: 'women'
      })),
      ...Array.from({ length: 4 }).map((_, i) => ({ 
        id: `men-${i}`, 
        name: `فئة رجالية ${i + 1}`, 
        image: `https://csspicker.dev/api/image/?q=men+fashion+${i}&image_type=photo`,
        categoryType: 'men'
      })),
      ...Array.from({ length: 3 }).map((_, i) => ({ 
        id: `kids-${i}`, 
        name: `فئة أطفال ${i + 1}`, 
        image: `https://csspicker.dev/api/image/?q=kids+fashion+${i}&image_type=photo`,
        categoryType: 'kids'
      }))
    ]
  }
  loading.value = false
  
  // Show promo popup after 2 seconds
  setTimeout(() => {
    showPromoPopup.value = true
  }, 2000)
})
</script>

<style scoped>
/* Base Layout */
.page{min-height:100dvh;background:#f9fafb;position:relative}

/* Tabs Navigation */
.tabs{display:flex;align-items:center;gap:16px;padding:10px 12px;overflow-x:auto;white-space:nowrap}
.tabs::-webkit-scrollbar{height:2px}
.tabs::-webkit-scrollbar-thumb{background:#e5e7eb}
.tabs button{background:transparent;border:0;color:#6b7280;cursor:pointer;padding:4px 8px;transition:all 0.2s;font-size:14px}
.tabs button:hover{color:#111}
.tabs .on{color:#111;font-weight:700;border-bottom:2px solid #111;padding-bottom:4px}
.tabs .sm{font-size:12px}

/* Layout Grid - مع padding للهيدر والتبويبات */
.layout{
  display:grid;
  grid-template-columns:180px 1fr;
  min-height:0;
  margin-top:104px; /* 56px header + 48px tabs */
  height:calc(100dvh - 104px - 60px); /* minus header, tabs and bottom nav */
}

/* Enhanced Sidebar - scroll منفصل */
.side{
  background:#f3f4f6;
  padding:12px;
  overflow-y:auto;
  height:100%;
}
.side::-webkit-scrollbar{width:6px}
.side::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
.side .it{
  padding:10px 8px;
  border-bottom:1px solid #e5e7eb;
  color:#374151;
  font-size:13px;
  background:transparent;
  border:0;
  text-align:start;
  width:100%;
  cursor:pointer;
  transition:all 0.2s;
  border-radius:6px;
  margin-bottom:2px;
}
.side .it:hover{background:#e5e7eb;transform:translateX(-2px)}
.side .it.active{background:#fff;color:#111;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.1)}

/* Main Content - scroll منفصل */
.main{
  padding:12px;
  overflow-y:auto;
  height:100%;
}

/* Promo Banner */
.promo-banner{
  background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius:12px;
  padding:16px;
  margin-bottom:16px;
  overflow:hidden;
  box-shadow:0 4px 12px rgba(102,126,234,0.2);
}
.promo-content h3{
  color:#fff;
  font-size:18px;
  font-weight:700;
  margin-bottom:12px;
  text-align:center;
}
.promo-img{
  width:100%;
  height:120px;
  object-fit:cover;
  border-radius:8px;
}

/* Section Title */
.ttl{text-align:center;font-weight:700;margin:16px 0;font-size:18px;color:#111}
.ttl2{font-size:16px;font-weight:600;margin:20px 0 12px;color:#374151}

/* Featured Subcategories */
.featured-section{margin-bottom:16px}
.subcategories-scroll{
  display:flex;
  gap:8px;
  overflow-x:auto;
  padding:8px 0;
  margin-bottom:12px;
}
.subcategories-scroll::-webkit-scrollbar{height:4px}
.subcategories-scroll::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:2px}
.subcat-btn{
  padding:8px 16px;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:20px;
  color:#6b7280;
  font-size:13px;
  white-space:nowrap;
  cursor:pointer;
  transition:all 0.2s;
}
.subcat-btn:hover{
  background:#f9fafb;
  border-color:#111;
  color:#111;
}

/* Categories Grid */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.cell{
  display:flex;
  flex-direction:column;
  align-items:center;
  text-decoration:none;
  color:inherit;
  cursor:pointer;
  transition:transform 0.2s;
  position:relative;
}
.cell:hover{transform:translateY(-4px)}
.cell img{
  width:80px;
  height:80px;
  border-radius:999px;
  object-fit:cover;
  background:#e5e7eb;
  border:2px solid transparent;
  transition:border-color 0.2s;
}
.cell:hover img{border-color:#111}
.name{
  font-size:12px;
  color:#374151;
  margin-top:6px;
  line-height:1.2;
  text-align:center;
  max-width:90px;
}
.badge{
  position:absolute;
  top:-4px;
  right:8px;
  background:#ef4444;
  color:#fff;
  font-size:9px;
  padding:2px 6px;
  border-radius:10px;
  font-weight:600;
}

/* Suggestions */
.grid.suggestions .cell img{width:90px;height:90px}

/* Promo Popup */
.popup-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.6);
  display:grid;
  place-items:center;
  z-index:9999;
  padding:20px;
  backdrop-filter:blur(4px);
  animation:fadeIn 0.3s ease;
}
@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}
.popup-content{
  background:#fff;
  border-radius:16px;
  max-width:400px;
  width:100%;
  position:relative;
  box-shadow:0 20px 60px rgba(0,0,0,0.3);
  animation:slideUp 0.3s ease;
}
@keyframes slideUp{
  from{transform:translateY(20px);opacity:0}
  to{transform:translateY(0);opacity:1}
}
.popup-close{
  position:absolute;
  top:12px;
  left:12px;
  width:32px;
  height:32px;
  border-radius:999px;
  background:#f3f4f6;
  border:0;
  font-size:24px;
  cursor:pointer;
  display:grid;
  place-items:center;
  color:#6b7280;
  transition:all 0.2s;
  z-index:10;
}
.popup-close:hover{background:#e5e7eb;color:#111}
.popup-body{padding:40px 24px 24px}
.popup-title{
  text-align:center;
  font-size:22px;
  font-weight:700;
  color:#111;
  margin-bottom:12px;
}
.popup-discount{
  text-align:center;
  margin-bottom:12px;
}
.discount-percent{
  font-size:48px;
  font-weight:900;
  color:#ef4444;
  display:block;
  line-height:1;
}
.discount-text{
  font-size:20px;
  font-weight:600;
  color:#111;
  display:block;
}
.popup-subtitle{
  text-align:center;
  font-size:14px;
  color:#6b7280;
  margin-bottom:20px;
  font-weight:600;
}
.popup-input{
  width:100%;
  padding:12px 16px;
  border:1px solid #e5e7eb;
  border-radius:8px;
  font-size:14px;
  margin-bottom:12px;
  outline:none;
  transition:border-color 0.2s;
}
.popup-input:focus{border-color:#111}
.popup-btn{
  width:100%;
  padding:14px;
  background:#ef4444;
  color:#fff;
  border:0;
  border-radius:8px;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
  transition:background 0.2s;
}
.popup-btn:hover{background:#dc2626}
.popup-terms{
  font-size:11px;
  color:#9ca3af;
  text-align:center;
  margin-top:16px;
  line-height:1.4;
}

/* Responsive Design */
@media (max-width: 768px){
  .layout{grid-template-columns:140px 1fr}
  .side .it{font-size:12px;padding:8px 6px}
  .tabs{gap:12px}
  .tabs button{font-size:13px}
}

@media (max-width: 520px){
  .layout{grid-template-columns:110px 1fr}
  .grid{grid-template-columns:repeat(3,1fr);gap:10px}
  .cell img{width:72px;height:72px}
  .name{font-size:11px;max-width:80px}
  .side .it{font-size:11px;padding:6px 4px}
  .promo-banner{padding:12px}
  .promo-content h3{font-size:16px}
  .promo-img{height:100px}
  .ttl{font-size:16px}
  .popup-body{padding:32px 20px 20px}
  .popup-title{font-size:20px}
  .discount-percent{font-size:42px}
  .discount-text{font-size:18px}
}
</style>

