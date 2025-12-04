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
import { apiPost } from './lib/api'
// Track affiliate ref
const ref = new URLSearchParams(location.search).get('ref'); if (ref) { try { sessionStorage.setItem('affiliate_ref', ref) } catch { } }

// Capture token from URL (?t=...) after OAuth/SSO and persist locally for SPA Authorization header
try {
  const url = new URL(location.href)
  const tok = url.searchParams.get('t')
  if (tok && tok.trim()) {
    try { localStorage.setItem('shop_token', tok) } catch { }
    try {
      // Write non-HttpOnly cookie for environments blocking third-party cookies; keep SameSite compatible
      const host = location.hostname
      const parts = host.split('.')
      const apex = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : ''
      const isHttps = location.protocol === 'https:'
      const sameSite = isHttps ? 'None' : 'Lax'
      const secure = isHttps ? ';Secure' : ''
      const domainPart = apex ? `;domain=${apex}` : ''
      document.cookie = `shop_auth_token=${encodeURIComponent(tok)};path=/;max-age=${60 * 60 * 24 * 30}${domainPart};SameSite=${sameSite}${secure}`
    } catch { }
    // Clean token from URL
    try { url.searchParams.delete('t'); history.replaceState({}, '', url.toString()) } catch { }
  }
} catch { }

// Fallback: if misconfigured Facebook redirect hits m.jeeey.com /api/admin/auth/sso/callback,
// push it to the correct API callback to complete login seamlessly
try {
  const p = location.pathname
  if (p.startsWith('/api/admin/auth/sso/callback')) {
    const qs = location.search || ''
    const apiBase = (import.meta as any)?.env?.VITE_API_BASE || (location.protocol + '//' + location.host.replace(/^m\./, 'api.'))
    const dest = `${apiBase}/api/auth/facebook/callback${qs}`
    location.replace(dest)
  }
} catch { }

// Ensure fbp/fbc cookies exist for better CAPI matching
try {
  const params = new URLSearchParams(location.search)
  const fbclid = params.get('fbclid')
  const now = Math.floor(Date.now() / 1000)
  const setCookie = (k: string, v: string, days = 180) => { try { const d = new Date(Date.now() + days * 864e5).toUTCString(); document.cookie = `${k}=${encodeURIComponent(v)}; path=/; expires=${d}` } catch { } }
  if (fbclid) {
    const fbcVal = `fb.1.${now}.${fbclid}`
    setCookie('_fbc', fbcVal)
  }
  if (!document.cookie.includes('_fbp=')) {
    const rand = Math.floor(Math.random() * 1e10)
    const fbpVal = `fb.1.${now}.${rand}`
    setCookie('_fbp', fbpVal)
  }
} catch { }

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
  { path: '/search/result', component: () => import('./pages/search/result.vue') },
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
  , { path: '/order/track', component: () => import('./pages/OrderTrack.vue') }
  , { path: '/returns', component: () => import('./pages/Returns.vue') }
  , { path: '/help', component: () => import('./pages/Help.vue') }
  , { path: '/contact', component: () => import('./pages/Contact.vue') }
  , { path: '/points', component: () => import('./pages/Points.vue') }
  , { path: '/prefs', component: () => import('./pages/Prefs.vue') }
  , { path: '/tabs/:slug', component: () => import('./pages/Home.vue') }
  , { path: '/tabs/preview', component: () => import('./pages/tabs/preview.vue') }
  , { path: '/__preview/tabs', component: () => import('./pages/__preview/tabs.vue') }
  , { path: '/__admin_preview', component: () => import('./pages/__admin_preview.vue') }
  , { path: '/coupons', component: () => import('./pages/coupons.vue') }
  , { path: '/auth/google/callback', component: () => import('./pages/auth/google/callback.vue') }
  , { path: '/reset-password', component: () => import('./pages/ResetPassword.vue') }
];
const routes = [...manualRoutes, ...genRoutes, { path: '/:pathMatch(.*)*', component: () => import('./pages/NotFound.vue') }];

const app = createApp(App);
app.use(createPinia());
import { useUser } from './store/user';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Always scroll to top on route changes, and to anchor if provided
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { left: 0, top: 0 }
  }
});

// Global Navigation Guard
router.beforeEach((to, from, next) => {
  const user = useUser();
  const cart = useCart();

  // 1. Auth Protection: Redirect logged-in users from Auth pages
  const authPages = ['/login', '/register', '/forgot', '/reset-password', '/verify'];
  // Check if path starts with any auth page (to handle sub-paths if any, though exact match is usually safer for these)
  if (authPages.includes(to.path) && user.isLoggedIn) {
    // Redirect to return URL or Account
    return next({ path: (to.query.return as string) || '/account', replace: true });
  }

  // 2. Checkout Protection: Redirect empty cart from Checkout
  if (to.path === '/checkout' && cart.count === 0) {
    return next({ path: '/cart', replace: true });
  }

  // 3. Duplicate Prevention: Prevent pushing the exact same page
  if (to.fullPath === from.fullPath) {
    return next(false);
  }

  next();
});

app.use(router);
app.mount('#app');
injectTracking();
// Ensure PageView fires on SPA navigations (avoid duplicate on initial load if index.html already fired)
try {
  const firePV = () => { try { const fbq = (window as any).fbq; if (typeof fbq === 'function') { const now = Date.now(); const last = (window as any).__LAST_PV_TS__ || 0; if (now - last > 800) { fbq('track', 'PageView'); (window as any).__LAST_PV_TS__ = now; } } } catch { } }
  if (!(window as any).__FB_PV_BOOT_INIT) { firePV(); }
  router.afterEach(() => { firePV(); })
} catch { }
try {
  const cart = useCart(); cart.loadLocal();
  // If logged in (token cookie present) hydrate from server; else for guests hydrate if local is empty (guest cart via cookie)
  try {
    const hasTok = document.cookie.includes('shop_auth_token=') || document.cookie.includes('auth_token=')
    if (hasTok) {
      // Best-effort: link anonymous session to user after any login/callback (incl. social)
      try {
        const already = sessionStorage.getItem('__linked_v1') === '1'
        const sid = localStorage.getItem('sid_v1') || ''
        if (!already && sid) {
          apiPost('/api/analytics/link', { sessionId: sid })
            .then(() => { try { sessionStorage.setItem('__linked_v1', '1') } catch { } })
            .catch(() => { })
        }
      } catch { }
      cart.syncFromServer().catch(() => { })
    }
    else if (!Array.isArray(cart.items) || cart.items.length === 0) { cart.syncFromServer().catch(() => { }) }
  } catch { }
} catch { }
try { initCurrency() } catch { }

