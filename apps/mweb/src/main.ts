import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { routes as genRoutes } from './routes.generated';
import App from './App.vue';
import './tokens.css';
import './styles.css';

const routes = genRoutes;

const app = createApp(App);
app.use(createPinia());
app.use(createRouter({ history: createWebHistory(), routes }));
app.mount('#app');

