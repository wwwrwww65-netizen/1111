import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { routes as genRoutes } from './routes.generated';
import App from './App.vue';
import './tokens.css';
import './styles.css';
import { injectTracking } from './tracking';

const manualRoutes = [
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
  { path: '/pay/processing', component: () => import('./pages/PayProcessing.vue') },
  { path: '/pay/success', component: () => import('./pages/PaySuccess.vue') },
  { path: '/pay/failure', component: () => import('./pages/PayFailure.vue') }
];
const routes = [...manualRoutes, ...genRoutes];

const app = createApp(App);
app.use(createPinia());
app.use(createRouter({ history: createWebHistory(), routes }));
app.mount('#app');
injectTracking();

