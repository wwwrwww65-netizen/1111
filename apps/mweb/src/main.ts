import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles.css';

const routes = [
  { path: '/', component: () => import('./pages/Home.vue') },
  { path: '/products', component: () => import('./pages/Products.vue') },
  { path: '/cart', component: () => import('./pages/Cart.vue') },
  { path: '/login', component: () => import('./pages/Login.vue') },
];

const app = createApp(App);
app.use(createPinia());
app.use(createRouter({ history: createWebHistory(), routes }));
app.mount('#app');

