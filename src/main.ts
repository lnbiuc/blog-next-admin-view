import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router/auto'
import ElementPlus from 'element-plus'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
})
app.use(router)
app.use(ElementPlus)
app.mount('#app')
