import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { routes as genRoutes } from './routes.generated';
import App from './App.vue';
import './tokens.css';
import './styles.css';

const manualRoutes = [
  { path: '/categories', component: () => import('./pages/Categories.vue') },
  { path: '/c/:slug', component: () => import('./pages/c/[slug].vue') },
  { path: '/wishlist', component: () => import('./pages/Wishlist.vue') },
  { path: '/account', component: () => import('./pages/Account.vue') },
  { path: '/orders', component: () => import('./pages/Orders.vue') },
  { path: '/checkout', component: () => import('./pages/Checkout.vue') },
  { path: '/p', component: () => import('./pages/Product.vue') }
];
const routes = [...manualRoutes, ...genRoutes];

const app = createApp(App);
app.use(createPinia());
app.use(createRouter({ history: createWebHistory(), routes }));
app.mount('#app');

