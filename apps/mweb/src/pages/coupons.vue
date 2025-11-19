<template>
  <div class="app" dir="rtl">
    <!-- Unified Header -->
    <header 
      class="unified-header" 
      :class="{ scrolled: isScrolled }"
      ref="header"
    >
      <!-- Header Left Section -->
      <div class="header-left">
        <button class="back-btn" @click="handleBack" aria-label="رجوع">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <!-- Tabs in Header -->
      <div class="tabs-container">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab" 
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.label }}
        </div>
      </div>
      
      <!-- Header Right Section -->
      <div class="header-right">
        <a href="#terms" class="tc-link" @click.prevent="handleTCClick">T&C</a>
      </div>
    </header>

    <!-- Filter Section (only for unused tab) -->
    <div class="filter-section" v-if="activeTab==='unused'">
      <div class="filter-container">
        <div 
          v-for="filter in filters" 
          :key="filter.id"
          class="filter-chip" 
          :class="{ active: activeFilter === filter.id }"
          @click="applyFilter(filter.id)"
        >
          {{ filter.label }}
        </div>
      </div>
    </div>

    <main class="content">
      <h1 class="page-title">{{ pageTitle }}</h1>

      <div class="coupon-list">
        <TransitionGroup name="coupon">
          <article 
            v-for="coupon in filteredCoupons" 
            :key="coupon.id"
            class="coupon-card" 
            :class="{
              expired: coupon.status === 'expired',
              used: coupon.status === 'used'
            }"
            :data-category="coupon.categories.join(' ')"
          >
            <div v-if="coupon.status !== 'unused'" class="badge">
              {{ coupon.status === 'expired' ? 'منتهي' : 'مستخدم' }}
            </div>
            
            <div class="card-left">
              <button 
                v-if="showShopButton"
                class="shop-btn" 
                :disabled="coupon.status !== 'unused'"
                @click="handleShopClick(coupon)"
              >
                تسوق
              </button>
              <h3 class="coupon-title">{{ coupon.title }}</h3>
              <p class="coupon-sub">{{ coupon.category }}</p>
              
              <div class="expiry-row" @click="toggleExpiryDetails(coupon.id)">
                <span class="expiry">{{ coupon.expiryText }}</span>
                <button 
                  class="exp-toggle" 
                  :class="{ open: expandedCoupons.includes(coupon.id) }"
                  :aria-expanded="expandedCoupons.includes(coupon.id)"
                >
                  ▾
                </button>
              </div>
              
              <Transition name="accordion">
                <div 
                  v-show="expandedCoupons.includes(coupon.id)"
                  class="expiry-details"
                >
                  <p v-if="getExpiryTs(coupon)">
                    ينتهي في: <strong>{{ expiryDateText(coupon) }}</strong>
                  </p>
                  <p>شروط الاستخدام:</p>
                  <ul>
                    <li v-for="condition in coupon.conditions" :key="condition">
                      {{ condition }}
                    </li>
                  </ul>
                </div>
              </Transition>
            </div>

            <div class="divider"></div>

            <div class="card-right">
              <div class="percent">{{ coupon.discount }}%</div>
              <div class="discount-note">{{ coupon.minOrderText || minOrderTextOf(coupon) }}</div>
              <div 
                class="timer" 
                :class="{ warning: isExpiringWithinDay(coupon) }"
                v-if="getExpiryTs(coupon) && coupon.status === 'unused'"
                aria-label="الوقت المتبقي"
              >
                {{ countdownText(coupon) }}
              </div>
            </div>
          </article>
        </TransitionGroup>
      </div>

      <div v-if="isLoading" class="loading">
        جاري التحميل
        <span class="spinner"></span>
      </div>

      <p v-if="!isLoading && filteredCoupons.length === 0" class="end-text">
        - لا توجد كوبونات متاحة -
      </p>
      
      <p v-else-if="!isLoading" class="end-text">
        - لا مزيد من المحتوى -
      </p>
    </main>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE, getAuthHeader } from '@/lib/api'

// Reactive state
const isScrolled = ref(false)
const activeTab = ref('unused')
const activeFilter = ref('all')
const expandedCoupons = ref([])
const isLoading = ref(false)
const toast = ref({ show: false, message: '', type: '' })

// Data
const tabs = [
  { id: 'unused', label: 'غير مستخدم' },
  { id: 'used', label: 'المستعملة' },
  { id: 'expired', label: 'انتهت الصلاحية' }
]

const filters = [
  { id: 'all', label: 'الكل' },
  { id: 'expiring', label: 'تنتهي قريباً' },
  { id: 'new', label: 'الجديد' },
  { id: 'club', label: 'JEEEY CLUB' },
  { id: 'shipping', label: 'كوبون شحن' },
  { id: 'discount', label: 'كوبون خصم' }
]

const coupons = ref([])
const nowTs = ref(Date.now())
let countdownInterval = null
const showShopButton = false

// Computed properties
const pageTitle = computed(() => {
  const titles = {
    unused: 'كوبوناتي',
    used: 'الكوبونات المستخدمة',
    expired: 'الكوبونات المنتهية'
  }
  return titles[activeTab.value] || 'كوبوناتي'
})

const filteredCoupons = computed(() => {
  let arr = coupons.value
  if (activeTab.value !== 'all') arr = arr.filter(c => c.status === activeTab.value)
  if (activeTab.value === 'unused' && activeFilter.value !== 'all') {
    arr = arr.filter(c => Array.isArray(c.categories) && c.categories.includes(activeFilter.value))
  }
  return arr
})

const router = useRouter()

// Methods
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const switchTab = async (tabId) => {
  if (activeTab.value === tabId) return
  
  activeTab.value = tabId
  isLoading.value = true
  
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 300))
  await fetchCoupons()
  
  isLoading.value = false
  
  // Analytics event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'tab_switch', { tab_type: tabId })
  }
}

const applyFilter = async (filterId) => {
  if (activeFilter.value === filterId) return
  
  activeFilter.value = filterId
  isLoading.value = true
  
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 300))
  await fetchCoupons()
  
  isLoading.value = false
  
  // Analytics event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'filter_applied', { filter_type: filterId })
  }
}

const toggleExpiryDetails = (couponId) => {
  const index = expandedCoupons.value.indexOf(couponId)
  if (index > -1) {
    expandedCoupons.value.splice(index, 1)
  } else {
    expandedCoupons.value.push(couponId)
  }
  
  // Save to localStorage
  localStorage.setItem(`expanded_${couponId}`, index === -1 ? 'open' : 'closed')
  
  // Analytics event
  if (typeof gtag !== 'undefined') {
    gtag('event', 'coupon_details_opened')
  }
}

const handleShopClick = async (coupon) => {
  if (coupon.status !== 'unused') {
    showToast('هذا الكوبون غير متاح للاستخدام', 'error')
    return
  }
  
  try {
    // Copy to clipboard
    await navigator.clipboard.writeText(coupon.code)
    showToast(`تم نسخ الكوبون: ${coupon.code}`, 'success')
    
    // Analytics event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'coupon_copy', { coupon_code: coupon.code })
    }
    
    // Simulate redirect
    setTimeout(() => {
      showToast('جاري التوجيه إلى صفحة المنتجات...', 'info')
    }, 1500)
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = coupon.code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    showToast(`تم نسخ الكوبون: ${coupon.code}`, 'success')
  }
}

const handleBack = () => {
  try { if (window.history.length > 1) { router.back(); return } } catch {}
  router.push('/')
}

const handleTCClick = () => { router.push('/legal/terms') }

// Lifecycle hooks
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  
  // Restore expanded state from localStorage
  coupons.value.forEach(coupon => {
    const savedState = localStorage.getItem(`expanded_${coupon.id}`)
    if (savedState === 'open') {
      expandedCoupons.value.push(coupon.id)
    }
  })
  fetchCoupons()

  // Complete claim flow after signup
  try{
    const sp = new URLSearchParams(location.search||'')
    if (sp.get('claim')==='1'){
      const token = sessionStorage.getItem('claim_token')||''
      if (token){
        fetch(`${API_BASE}/api/promotions/claim/complete`, { method:'POST', headers:{ 'content-type':'application/json', ...getAuthHeader() }, credentials:'include', body: JSON.stringify({ token }) })
          .then(()=>{
            showToast('تم جمع الكوبون', 'success')
            sessionStorage.removeItem('claim_token')
            sessionStorage.removeItem('pending_campaignId')
            sessionStorage.removeItem('pending_coupons')
            // refresh coupons to show granted ones
            fetchCoupons()
          }).catch(()=>{})
      }
    }
  }catch{}

  // Live countdown (HH:MM:SS)
  countdownInterval = setInterval(() => {
    nowTs.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (countdownInterval) clearInterval(countdownInterval)
})

// Watch for tab changes to reset filter
watch(activeTab, () => {
  activeFilter.value = 'all'
})

// Fetch coupons from API
async function fetchCoupons(){
  try{
    // Try authenticated coupons first
    let res = await fetch(`${API_BASE}/api/me/coupons`, { credentials:'include', headers: { 'Accept':'application/json', ...getAuthHeader() } })
    let j = await res.json().catch(()=>null)
    // لا يوجد سقوط للزوار: الصفحة خاصة بالمستخدمين فقط
  if (j){
    const itemsArr = Array.isArray(j.items) ? j.items : []
    const couponsArr = Array.isArray(j.coupons) ? j.coupons : []
    const merged = [...itemsArr, ...couponsArr]
    coupons.value = merged.map(mapToUiCoupon)
  }
  } catch (e) {
    // silently ignore; UI سيعرض النص الافتراضي
  }
}

// Normalize raw coupon record from API to UI shape expected by the page
function mapToUiCoupon(c){
  const now = Date.now()
  const validUntil = c?.validUntil ? new Date(c.validUntil) : null
  const expired = validUntil ? (validUntil.getTime() < now) : false
  const status = expired ? 'expired' : 'unused'
  const discountNum = Number(c?.discountValue||c?.discount||0)
  const minOrder = Number(c?.minOrderAmount||c?.min||0)
  const categories = ['discount']
  return {
    id: String(c.id||c.code||Math.random().toString(36).slice(2)),
    code: String(c.code||''),
    title: String(c.title||c.code||'كوبون'),
    discount: discountNum,
    discountType: String(c.discountType||'PERCENTAGE').toUpperCase()==='FIXED' ? 'FIXED' : 'PERCENTAGE',
    minOrderAmount: minOrder,
    minOrderText: minOrder>0 ? `حد أدنى ${minOrder}` : '',
    validUntil: c.validUntil || null,
    // UI helpers
    status,
    category: 'عام',
    categories,
    conditions: Array.isArray(c?.conditions)? c.conditions : []
  }
}

// Helpers: expiry timestamp and countdown formatter
function getExpiryTs(coupon){
  const raw = coupon?.validUntil || coupon?.valid_to || coupon?.expiresAt || (coupon?.schedule && coupon.schedule.to)
  if (!raw) return null
  const ts = new Date(raw).getTime()
  return Number.isFinite(ts) ? ts : null
}

function countdownText(coupon){
  const ts = getExpiryTs(coupon)
  if (!ts) return ''
  const diff = ts - nowTs.value
  if (diff <= 0) return '00:00:00'
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const dd = String(days).padStart(2, '0')
  const hh = String(hours).padStart(2, '0')
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return days > 0 ? `${dd}:${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
}

function isExpiringWithinDay(coupon){
  const ts = getExpiryTs(coupon)
  if (!ts) return false
  const diff = ts - nowTs.value
  return diff > 0 && diff <= 24 * 60 * 60 * 1000
}

function expiryDateText(coupon){
  const ts = getExpiryTs(coupon)
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString('ar', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return new Date(ts).toISOString()
  }
}

function minOrderTextOf(coupon){
  const min = coupon?.minOrderAmount ?? coupon?.min ?? (coupon?.rules && coupon.rules.min)
  if (!min || isNaN(min)) return 'بدون حد أدنى للشراء'
  return `طلبات أكثر من ${formatAmount(min)}`
}

function formatAmount(value){
  try {
    return new Intl.NumberFormat('ar', { maximumFractionDigits: 2 }).format(value)
  } catch {
    return String(value)
  }
}
</script>

<style>
:root {
  --bg: #ffffff;
  --card-bg: #fff6f4;
  --card-border: #f3d2c8;
  --accent: #ff5a3c;
  --text: #111111;
  --muted: #666666;
  --secondary-text: #8a8a8a;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --header-height: 70px;
  --page-title-size: 22px;
  --coupon-card-padding: 16px;
  --coupon-card-radius: 14px;
  --discount-percent-size: 32px;
  --shop-btn-height: 36px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Tajawal", "Noto Sans Arabic", sans-serif;
  background-color: var(--bg);
  color: var(--text);
  direction: rtl;
  line-height: 1.5;
}

.app {
  min-height: 100vh;
}

/* Unified Header Styles */
.unified-header {
  height: var(--header-height);
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  position: sticky;
  top: 0;
  z-index: 50;
  transition: box-shadow 0.3s ease;
}

.unified-header.scrolled {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Header Left Section */
.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: transparent;
  border: 0;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.back-btn:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Tabs in Header */
.tabs-container {
  display: flex;
  gap: 20px;
  position: absolute;
  right: 50%;
  transform: translateX(50%);
}

.tab {
  padding: 8px 0;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  font-size: 15px;
}

.tab.active {
  font-weight: bold;
  color: var(--text);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: 0;
  left: 0;
  height: 2px;
  background-color: #000;
}

.tab:not(.active) {
  color: #888;
  font-weight: normal;
}

/* Header Right Section */
.header-right {
  display: flex;
  align-items: center;
}

.tc-link {
  font-size: 14px;
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
}

.tc-link:hover {
  text-decoration: underline;
}

/* Filter Section */
.filter-section {
  background-color: #fff;
  padding: 12px 0;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.filter-section::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.filter-container {
  display: flex;
  padding: 0 14px;
  gap: 10px;
}

.filter-chip {
  background-color: #f7f7f7;
  border-radius: 18px;
  padding: 8px 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.filter-chip.active {
  border: 1px solid #000;
  font-weight: 500;
}

.filter-chip:hover:not(.active) {
  background-color: #f0f0f0;
}

/* Content Area */
.content {
  padding: 0 14px 40px;
}

.page-title {
  font-size: var(--page-title-size);
  font-weight: 700;
  margin: 18px 0 12px;
}

/* Coupon Cards */
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coupon-card {
  display: flex;
  align-items: stretch;
  gap: 12px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--coupon-card-radius);
  padding: var(--coupon-card-padding);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.coupon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.coupon-card.expired {
  opacity: 0.7;
}

.coupon-card.used {
  opacity: 0.7;
  background: #f5f5f5;
}

.coupon-card .badge {
  position: absolute;
  top: -8px;
  right: 16px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

/* Divider (Ticket Style) */
.coupon-card .divider {
  width: 1px;
  background: transparent;
  position: relative;
}

.coupon-card .divider::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 auto;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  border-left: 1px dashed rgba(200, 120, 100, 0.4);
}

.coupon-card .divider::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg);
  left: calc(50% - 7px);
  top: -7px;
  box-shadow: 0 0 0 1px var(--card-border) inset;
}

/* Right Side (Discount) */
.card-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  width: 120px;
  min-width: 96px;
}

.percent {
  font-size: var(--discount-percent-size);
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}

.discount-note {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin-top: 6px;
}

.timer {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: #ffffff;
  color: var(--text);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
}

.timer.warning {
  background: #fff4f0;
  color: var(--accent);
  border-color: var(--accent);
}

/* Left Side (Content) */
.card-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-btn {
  background: var(--text);
  color: #fff;
  border-radius: 8px;
  padding: 0 12px;
  height: var(--shop-btn-height);
  align-self: flex-start;
  border: 0;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, background-color 0.2s;
}

.shop-btn:hover:not(:disabled) {
  background-color: #333;
}

.shop-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.shop-btn:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.shop-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.coupon-title {
  font-size: 20px;
  font-weight: 700;
  margin: 4px 0;
}

.coupon-sub {
  font-size: 13px;
  color: var(--secondary-text);
  margin: 0;
}

.expiry-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  cursor: pointer;
}

.expiry {
  font-size: 13px;
  color: var(--secondary-text);
}

.exp-toggle {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--secondary-text);
  transition: transform 0.3s;
}

.exp-toggle.open {
  transform: rotate(180deg);
}

.expiry-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--card-border);
  font-size: 12px;
  color: var(--muted);
}

.expiry-details ul {
  margin-right: 20px;
  margin-top: 4px;
}

.expiry-details li {
  margin-bottom: 4px;
}

/* End Text */
.end-text {
  text-align: center;
  color: #999;
  margin-top: 40px;
  font-size: 14px;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 1000;
}

.toast.info {
  background: rgba(59, 130, 246, 0.9);
}

.toast.error {
  background: rgba(239, 68, 68, 0.9);
}

/* Loading State */
.loading {
  text-align: center;
  padding: 20px;
  color: var(--muted);
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--accent);
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.coupon-enter-active,
.coupon-leave-active {
  transition: all 0.3s ease;
}

.coupon-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.coupon-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.coupon-move {
  transition: transform 0.3s ease;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 200px;
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>