import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { routes as genRoutes } from './routes.generated';
import App from './App.vue';
import './tokens.css';
import './tailwind.css';
import './styles.css';
import { injectTracking } from './tracking';
import { useCart } from './store/cart'
import { initCurrency } from './lib/currency'
// Track affiliate ref
const ref = new URLSearchParams(location.search).get('ref'); if (ref) { try{ sessionStorage.setItem('affiliate_ref', ref) }catch{} }

// Fallback: if misconfigured Facebook redirect hits m.jeeey.com /api/admin/auth/sso/callback,
// push it to the correct API callback to complete login seamlessly
try{
  const p = location.pathname
  if (p.startsWith('/api/admin/auth/sso/callback')){
    const qs = location.search || ''
    const apiBase = (import.meta as any)?.env?.VITE_API_BASE || (location.protocol + '//' + location.host.replace(/^m\./,'api.'))
    const dest = `${apiBase}/api/auth/facebook/callback${qs}`
    location.replace(dest)
  }
}catch{}

// Ensure fbp/fbc cookies exist for better CAPI matching
try{
  const params = new URLSearchParams(location.search)
  const fbclid = params.get('fbclid')
  const now = Math.floor(Date.now()/1000)
  const setCookie = (k:string,v:string,days=180)=>{ try{ const d = new Date(Date.now()+days*864e5).toUTCString(); document.cookie = `${k}=${encodeURIComponent(v)}; path=/; expires=${d}` }catch{} }
  if (fbclid){
    const fbcVal = `fb.1.${now}.${fbclid}`
    setCookie('_fbc', fbcVal)
  }
  if (!document.cookie.includes('_fbp=')){
    const rand = Math.floor(Math.random()*1e10)
    const fbpVal = `fb.1.${now}.${rand}`
    setCookie('_fbp', fbpVal)
  }
}catch{}

const manualRoutes = [
  { path: '/mis', component: () => import('./pages/Mis.vue') },
  { path: '/categories', component: () => import('./pages/Categories.vue') },
  { path: '/products', component: () => import('./pages/Products.vue') },
  { path: '/c/:slug', component: () => import('./pages/c/[slug].vue') },
  { path: '/wishlist', component: () => import('./pages/Wishlist.vue') },
  { path: '/account', component: () => import('./pages/Account.vue') },
  { path: '/settings', component: () => import('./pages/Settings.vue') },
  { path: '/orders', component: () => import('./pages/Orders.vue') },
  { path: '/order/:id', component: () => import('./pages/OrderDetail.vue') },
  { path: '/checkout', component: () => import('./pages/Checkout.vue') },
  { path: '/p', component: () => import('./pages/Product.vue') },
  { path: '/categories/:slug', component: () => import('./pages/categories/[slug].vue') },
  { path: '/confirm', component: () => import('./pages/Confirm.vue') },
  { path: '/address', component: () => import('./pages/Address.vue') },
  // { path: '/map', component: () => import('./pages/Map.vue') }, // merged into Address.vue
  { path: '/register', component: () => import('./pages/Register.vue') },
  { path: '/forgot', component: () => import('./pages/Forgot.vue') },
  { path: '/verify', component: () => import('./pages/Verify.vue') },
  { path: '/complete-profile', component: () => import('./pages/CompleteProfile.vue') },
  { path: '/test', component: () => import('./pages/test.vue') },
  { path: '/j', component: () => import('./pages/j.vue') },
  { path: '/pay/processing', component: () => import('./pages/PayProcessing.vue') },
  { path: '/pay/success', component: () => import('./pages/PaySuccess.vue') },
  { path: '/pay/failure', component: () => import('./pages/PayFailure.vue') },
  { path: '/legal/terms', component: () => import('./pages/LegalTerms.vue') },
  { path: '/legal/privacy', component: () => import('./pages/LegalPrivacy.vue') },
  { path: '/legal/shipping', component: () => import('./pages/LegalShipping.vue') },
  { path: '/legal/returns', component: () => import('./pages/LegalReturns.vue') }
  ,{ path: '/order/track', component: () => import('./pages/OrderTrack.vue') }
  ,{ path: '/returns', component: () => import('./pages/Returns.vue') }
  ,{ path: '/help', component: () => import('./pages/Help.vue') }
  ,{ path: '/contact', component: () => import('./pages/Contact.vue') }
  ,{ path: '/points', component: () => import('./pages/Points.vue') }
  ,{ path: '/prefs', component: () => import('./pages/Prefs.vue') }
  ,{ path: '/tabs/:slug', component: () => import('./pages/Home.vue') }
  ,{ path: '/tabs/preview', component: () => import('./pages/tabs/preview.vue') }
  ,{ path: '/__preview/tabs', component: () => import('./pages/__preview/tabs.vue') }
  ,{ path: '/__admin_preview', component: () => import('./pages/__admin_preview.vue') }
  ,{ path: '/coupons', component: () => import('./pages/coupons.vue') }
  ,{ path: '/auth/google/callback', component: () => import('./pages/auth/google/callback.vue') }
  ,{ path: '/:pathMatch(.*)*', component: () => import('./pages/NotFound.vue') }
];
const routes = [...manualRoutes, ...genRoutes];

const app = createApp(App);
app.use(createPinia());
const router = createRouter({ 
  history: createWebHistory(), 
  routes,
  scrollBehavior(to, from, savedPosition){
    if (savedPosition) return savedPosition
    // Always scroll to top on route changes, and to anchor if provided
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { left: 0, top: 0 }
  }
});
app.use(router);
app.mount('#app');
injectTracking();
// Ensure PageView fires on SPA navigations (avoid duplicate on initial load if index.html already fired)
try{
  const firePV = ()=>{ try{ const fbq = (window as any).fbq; if (typeof fbq==='function'){ const now=Date.now(); const last=(window as any).__LAST_PV_TS__||0; if (now-last>800){ fbq('track','PageView'); (window as any).__LAST_PV_TS__=now; } } }catch{} }
  if (!(window as any).__FB_PV_BOOT_INIT) { firePV(); }
  router.afterEach(()=>{ firePV(); })
}catch{}
try{ const cart = useCart(); cart.loadLocal();
  // If logged in (token cookie present) hydrate from server; else for guests hydrate if local is empty (guest cart via cookie)
  try{
    const hasTok = document.cookie.includes('shop_auth_token=') || document.cookie.includes('auth_token=')
    if (hasTok) {
      // Best-effort: link anonymous session to user after any login/callback (incl. social)
      try{
        const already = sessionStorage.getItem('__linked_v1') === '1'
        const sid = localStorage.getItem('sid_v1') || ''
        if (!already && sid){
          await fetch('/api/analytics/link', { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'include', body: JSON.stringify({ sessionId: sid }) })
          sessionStorage.setItem('__linked_v1','1')
        }
      }catch{}
      cart.syncFromServer().catch(()=>{})
    }
    else if (!Array.isArray(cart.items) || cart.items.length===0) { cart.syncFromServer().catch(()=>{}) }
  }catch{}
}catch{}
try{ initCurrency() }catch{}

