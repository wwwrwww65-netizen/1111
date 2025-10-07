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
// Track affiliate ref
const ref = new URLSearchParams(location.search).get('ref'); if (ref) { try{ sessionStorage.setItem('affiliate_ref', ref) }catch{} }

const manualRoutes = [
  { path: '/mis', component: () => import('./pages/Mis.vue') },
  { path: '/categories', component: () => import('./pages/Categories.vue') },
  { path: '/c/:slug', component: () => import('./pages/c/[slug].vue') },
  { path: '/wishlist', component: () => import('./pages/Wishlist.vue') },
  { path: '/account', component: () => import('./pages/Account.vue') },
  { path: '/orders', component: () => import('./pages/Orders.vue') },
  { path: '/order/:id', component: () => import('./pages/OrderDetail.vue') },
  { path: '/checkout', component: () => import('./pages/Checkout.vue') },
  { path: '/p', component: () => import('./pages/Product.vue') },
  { path: '/confirm', component: () => import('./pages/Confirm.vue') },
  { path: '/address', component: () => import('./pages/Address.vue') },
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
  ,{ path: '/auth/google/callback', component: () => import('./pages/auth/google/callback.vue') }
  ,{ path: '/:pathMatch(.*)*', component: () => import('./pages/NotFound.vue') }
];
const routes = [...manualRoutes, ...genRoutes];

const app = createApp(App);
app.use(createPinia());
const router = createRouter({ history: createWebHistory(), routes });
app.use(router);
app.mount('#app');
injectTracking();
try{ const cart = useCart(); cart.loadLocal() }catch{}

// Apply theme CSS variables for mweb (live config)
try {
  fetch('/api/theme/config?site=mweb', { credentials:'include' })
    .then(r=> r.json()).then(j=> {
      const theme = j?.theme || {};
      const root = document.documentElement as HTMLElement;
      const c: any = theme.colors || {};
      if (c.primary) root.style.setProperty('--color-primary', String(c.primary));
      if (c.secondary) root.style.setProperty('--color-secondary', String(c.secondary));
      if (c.bg) root.style.setProperty('--color-bg', String(c.bg));
      if (c.text) root.style.setProperty('--color-text', String(c.text));
      const r: any = theme.radius || {};
      if (r.md != null) root.style.setProperty('--radius-md', String(r.md) + 'px');
      if (r.lg != null) root.style.setProperty('--radius-lg', String(r.lg) + 'px');
    }).catch(()=>{});
} catch {}

