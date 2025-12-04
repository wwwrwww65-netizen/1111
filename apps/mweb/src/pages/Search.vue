<template>
  <div dir="rtl" lang="ar" class="shein-search-page">
    <!-- Fixed Search Header -->
    <header class="search-header">
      <!-- Back Button: 24x24 Icon, No Container -->
      <div class="back-btn-wrapper" @click="goBack">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      
      <div class="search-bar">
        <input 
          ref="searchInput"
          class="search-input" 
          v-model="q" 
          :placeholder="placeholder" 
          @keyup.enter="runSearch" 
          @focus="isFocused = true"
          aria-label="بحث" 
        />
        <button class="camera-btn" aria-label="بحث بالصور" @click="openImagePicker">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="13" r="4" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <!-- Search Icon Button (Oval, Bigger, on the Left/End) -->
        <button class="search-icon-btn" @click="runSearch">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Main Scrollable Content -->
    <div class="search-content">
      
      <!-- Auto-complete Suggestions (Vertical List) -->
      <div v-if="q && suggestions.length" class="suggestions-layer">
        <div 
          v-for="(s, i) in suggestions" 
          :key="i" 
          class="suggestion-item" 
          @click="applyQuick(s)"
        >
          <span class="suggestion-text" v-html="highlightMatch(s)"></span>
          <svg class="arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- Default View: History & Trending -->
      <div v-else-if="!searched" class="default-view">
        
        <!-- Wrapped Lists & Footer in Container -->
        <div class="search-body-container">
          <!-- Recent Search History -->
          <section class="history-section" v-if="historyList.length">
            <div class="section-header">
              <h3 class="section-title">البحث الأخير</h3>
              <button class="clear-history-btn" @click="clearHistory">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="chips-container">
              <button v-for="(t,i) in visibleHistory" :key="t" class="chip" @click="applyQuick(t)">
                {{ t }}
              </button>
            </div>
          </section>

          <!-- Discover / Search & Find -->
          <section class="discover-section" v-if="discoverTags.length">
            <h3 class="section-title">البحث والعثور</h3>
            <div class="chips-container">
              <button v-for="tag in discoverTags" :key="tag" class="chip" @click="applyQuick(tag)">
                {{ tag }}
              </button>
            </div>
          </section>

          <!-- Trending Cards (Horizontal Scroll) -->
          <div class="trending-scroll-container">
            <div class="trending-card" v-for="(group, gIndex) in trendingGroups" :key="gIndex">
              <div class="card-header">
                <!-- Modern Crown Icon -->
                <svg class="crown-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 20H22" stroke="#FF5722" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5 17L2 7L9 10L12 2L15 10L22 7L19 17H5Z" stroke="#FF5722" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="card-title">{{ group.title }}</span>
              </div>
              <div class="card-body">
                <div 
                  v-for="(item, i) in group.items" 
                  :key="i" 
                  class="rank-row" 
                  @click="applyQuick(item.title)"
                >
                  <!-- Bookmark Badge with Number -->
                  <div class="rank-badge-wrapper">
                    <svg class="bookmark-icon" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 4C0 1.79086 1.79086 0 4 0H20C22.2091 0 24 1.79086 24 4V28L12 22L0 28V4Z" :fill="getRankColor(i)"/>
                    </svg>
                    <span class="rank-num">{{ i + 1 }}</span>
                  </div>
                  <span class="rank-text">{{ item.title }}</span>
                  <span v-if="item.tag" class="rank-tag" :class="getRankTagClass(item.tagType)">{{ item.tag }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Requested Footer Text -->
          <div class="footer-note">
            يتم تحديث البحث عن الموديلات العصرية يومياً ليعكس ما يبحث عنه عشاق الموضة.
          </div>
        </div>

      </div>

      <!-- Search Results (If searched) -->
      <section v-else class="results-view">
        <div class="results-header">
          <span>النتائج لـ "{{ q }}"</span>
        </div>
        <div class="products-grid" v-if="items.length">
           <ProductCard
            v-for="p in items"
            :key="p.id"
            :id="p.id"
            :img="p.img"
            :title="p.title"
            :price="fmtPrice(p.price)"
            :afterCoupon="p.after"
            :discountPercent="p.off"
            :soldCount="p.sold"
            :isFastShipping="p.fast"
          />
        </div>
        <div v-else class="no-results">
          <p>لا توجد نتائج مطابقة</p>
        </div>
      </section>

    </div>
    
    <!-- BottomNav Removed -->
  </div>
</template>

<script setup lang="ts">
// Removed BottomNav import
import ProductCard from '@/components/ProductCard.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE, apiGet, apiPost } from '@/lib/api'
import { fmtPrice } from '@/lib/currency'

const router = useRouter()
const route = useRoute()
const q = ref('')
const searchInput = ref<HTMLInputElement|null>(null)
const isFocused = ref(false)
const searched = ref(false)
const items = ref<any[]>([])
const placeholder = 'فساتين نسائية سهره فخمه'

// History
const historyList = ref<string[]>([])
const showAllHistory = ref(false)
const maxHistory = 10
const visibleHistory = computed(() => showAllHistory.value ? historyList.value : historyList.value.slice(0, maxHistory))

function toggleHistory() { showAllHistory.value = !showAllHistory.value }
function saveHistory(term: string) {
  const list = Array.from(new Set([term, ...historyList.value])).slice(0, 20)
  historyList.value = list
  localStorage.setItem('search_history', JSON.stringify(list))
}
function clearHistory() {
  historyList.value = []
  localStorage.removeItem('search_history')
}

// Suggestions
const suggestions = ref<string[]>([])
let debounceTimer: any
watch(q, (newVal) => {
  clearTimeout(debounceTimer)
  if (!newVal.trim()) {
    suggestions.value = []
    searched.value = false
    return
  }
  debounceTimer = setTimeout(async () => {
    // Use the new trending endpoint for suggestions if needed, or keep mock for now
    // For better UX, we could implement a specific suggestion endpoint later
    const mock = ['فستان', 'فستان سهرة', 'فستان طويل', 'فستان احمر', 'فستان زفاف', 'فستان صيفي']
    suggestions.value = mock.filter(s => s.includes(newVal.trim())).slice(0, 10)
  }, 150)
})

function highlightMatch(text: string) {
  const regex = new RegExp(`(${q.value.trim()})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

// Trending Data
const trendingGroups = ref<Array<{ title: string; items: any[] }>>([])
const discoverTags = ref<string[]>([])

async function fetchTrendingTerms(categoryId?: string, limit = 10): Promise<string[]> {
  try {
    const url = categoryId 
      ? `/api/search/trending?limit=${limit}&categoryId=${categoryId}`
      : `/api/search/trending?limit=${limit}`
    const data = await apiGet<{ terms: string[] }>(url)
    return data?.terms || []
  } catch (e) {
    console.error('Failed to fetch trending:', e)
    return []
  }
}

async function fetchCategories() {
  try {
    // 1. Fetch Global Trending for "Discover" section
    const globalTerms = await fetchTrendingTerms(undefined, 10)
    if (globalTerms.length) {
      discoverTags.value = globalTerms
    } else {
      // Fallback if no analytics yet
      discoverTags.value = ['فستان', 'هودي', 'ساعة', 'حقيبة', 'حذاء']
    }

    // 2. Fetch Top Categories and their trending terms
    const data = await apiGet<any>('/api/categories?limit=10&parentId=null')
    let cats = []
    if (data && Array.isArray(data.categories)) {
       cats = data.categories
    } else if (Array.isArray(data)) {
       cats = data
    }

    if (cats.length === 0) {
      cats = [
        { name: 'نساء', id: '' }, { name: 'رجال', id: '' }, { name: 'أطفال', id: '' }, { name: 'منزل', id: '' }
      ]
    }

    // Sort categories by popularity
    const priority = ['نساء', 'women', 'رجال', 'men', 'أطفال', 'kids', 'تجميل', 'beauty', 'منزل', 'home']
    cats.sort((a: any, b: any) => {
      const aName = (a.name || '').toLowerCase()
      const bName = (b.name || '').toLowerCase()
      const aIdx = priority.findIndex(p => aName.includes(p))
      const bIdx = priority.findIndex(p => bName.includes(p))
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return 0
    })

    // Take top 5 categories
    const topCats = cats.slice(0, 5)
    
    // Fetch trending terms for each category in parallel
    const groups = await Promise.all(topCats.map(async (c: any) => {
      const terms = await fetchTrendingTerms(c.id, 10)
      // If no terms found for this category (cold start), use a generic fallback or skip
      // For now, we'll show empty if no data to encourage searching
      return {
        title: c.name || 'عام',
        items: terms.map(t => ({ title: t, tag: '', tagType: '' }))
      }
    }))

    // Filter out groups with no items to avoid empty sections? 
    // User wants 5 lists, so we keep them even if empty? 
    // Better to show them. If empty, maybe show "No trends yet" or fallback?
    // Let's use a fallback if empty to ensure UI looks good initially
    trendingGroups.value = groups.map((g, i) => {
      if (g.items.length === 0) {
        // Temporary fallback until data accumulates
        const fallback = ['جديد', 'عرض', 'تخفيضات', 'مميز']
        return { ...g, items: fallback.map(t => ({ title: t, tag: '', tagType: '' })) }
      }
      return g
    })

  } catch (e) {
    console.error('Failed to fetch categories for trending:', e)
  }
}

function getRankColor(index: number) {
  if (index === 0) return '#FFD700' // Gold
  if (index === 1) return '#B39DDB' // Light Purple
  if (index === 2) return '#CD7F32' // Bronze (Reverted)
  return '#C0C0C0' // Silver (Previous Rank 2)
}

function getRankTagClass(type: string) {
  if (type === 'hot') return 'tag-hot'
  if (type === 'new') return 'tag-new'
  return ''
}

// Actions
function goBack() {
  router.back()
}

function clearText() {
  q.value = ''
  suggestions.value = []
  searched.value = false
  searchInput.value?.focus()
}

function applyQuick(term: string) {
  q.value = term
  runSearch()
}

function openImagePicker() {
  console.log('Open image picker')
}

import { smartPush } from '@/lib/smartNavigation'

// ...

async function runSearch() {
  const term = q.value.trim()
  if (!term) return
  
  searched.value = true
  suggestions.value = []
  saveHistory(term)
  
  // Log search event for analytics (fire and forget)
  // We try to infer category context if possible, but usually search is global
  // If we were in a category page, we'd pass that ID. Here we are global.
  apiPost('/events', {
    name: 'search',
    properties: { query: term }
  }).catch(() => {})

  smartPush(router, { path: '/search/result', query: { q: term } })
}

onMounted(() => {
  if (route.query.q) {
    q.value = String(route.query.q)
  }
  
  // Load history from local storage
  try {
    const saved = localStorage.getItem('search_history')
    if (saved) {
      historyList.value = JSON.parse(saved)
    }
  } catch {}

  fetchCategories()
})
</script>

<style scoped>
.shein-search-page {
  background-color: #fff;
  min-height: 100vh;
  /* No bottom padding needed as nav is removed */
  font-family: 'DIN Next LT Arabic', sans-serif;
}

/* Header */
.search-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 54px; /* Adjusted height */
  background: #fff;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  gap: 10px; /* Added gap directly to header */
}

/* Back Button Wrapper - Minimal, just for click target */
.back-btn-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 24px;
  height: 24px;
}

.search-bar {
  flex: 1;
  height: 36px; /* Slightly smaller height */
  border: 1px solid #222;
  border-radius: 18px;
  display: flex;
  align-items: center;
  /* Swapped padding: Right (Start) 14px, Left (End) 2px */
  padding: 0 14px 0 2px; 
  gap: 6px;
  background: #fff;
}

/* Oval Search Button */
.search-icon-btn {
  background: #8a1538;
  border-radius: 16px; /* Oval shape */
  width: 44px; /* Adjusted width */
  height: 30px; /* Adjusted height */
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  /* Removed order: -1 to let it sit at the end naturally */
}
.search-icon-btn svg path {
  stroke: #fff;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px; /* Slightly smaller font */
  color: #222;
  text-align: right;
  background: transparent;
}

.camera-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  opacity: 0.6;
  display: flex;
  align-items: center;
}

/* Content */
.search-content {
  padding-top: 54px; /* Match header height */
  padding-bottom: 30px;
}

/* Suggestions */
.suggestions-layer {
  background: #fff;
  min-height: calc(100vh - 54px);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f9f9f9;
  cursor: pointer;
}

.suggestion-text {
  font-size: 13px;
  color: #333;
}

.suggestion-text :deep(.highlight) {
  font-weight: bold;
  color: #000;
}

/* Default View */
.default-view {
  /* 
    User wants "no distance on the left side" generally, 
    BUT "Recent Search and Search & Find and their slides and the text below... a distance on the left side".
    So we keep the container flush (0 left padding), and add padding to specific children.
  */
  padding: 14px 14px 14px 0;
}

/* New Container for Lists & Footer */
.search-body-container {
  width: 100%;
}

/* Specific Left Spacing for Sections */
.history-section,
.discover-section,
.footer-note {
  padding-left: 14px; /* Add left padding to these specific sections */
}

/* Trending Scroll Container - Keep Flush Left */
.trending-scroll-container {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding-bottom: 10px;
  scrollbar-width: none; 
  -ms-overflow-style: none;
  margin-left: 0; /* Ensure flush left */
}
.trending-scroll-container::-webkit-scrollbar {
  display: none;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px; /* Adjusted font size */
  font-weight: bold;
  color: #000;
  margin: 0;
}

/* Fix: Add bottom margin to Discover title */
.discover-section .section-title {
  margin-bottom: 10px;
}

.clear-history-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.chip {
  background: #F7F8FA;
  border: none;
  padding: 6px 14px; /* Adjusted padding */
  border-radius: 4px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.trending-card {
  min-width: 260px; /* Slightly narrower */
  max-width: 300px;
  background: #fff;
  border: 1px solid #F0F0F0;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-header {
  background: linear-gradient(to left, #FFF0F0, #fff);
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.crown-icon {
  width: 20px;
  height: 20px;
}

.card-title {
  font-weight: bold;
  font-size: 13px;
  color: #E54D42;
}

.card-body {
  padding: 0 10px 10px 10px;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f9f9f9;
  cursor: pointer;
}
.rank-row:last-child {
  border-bottom: none;
}

/* Bookmark Badge */
.rank-badge-wrapper {
  position: relative;
  width: 20px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmark-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.rank-num {
  position: relative;
  z-index: 1;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
  margin-top: -3px;
}

.rank-text {
  font-size: 13px;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

/* Footer Note */
.footer-note {
  font-size: 11px;
  color: #999;
  text-align: center;
  margin-top: 20px;
  padding-right: 20px; /* Keep right padding */
  /* padding-left added above */
  line-height: 1.4;
}

/* Results */
.results-view {
  padding: 14px;
}

.results-header {
  margin-bottom: 14px;
  font-size: 13px;
  color: #666;
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.no-results {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>
