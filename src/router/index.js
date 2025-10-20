import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/views/OrdersPage.vue')
  },
  {
    path: '/incomes',
    name: 'incomes',
    component: () => import('@/views/IncomesPage.vue')
  },
  {
    path: '/sales',
    name: 'sales',
    component: () => import('@/views/SalesPage.vue')
  },
  {
    path: '/stocks',
    name: 'stocks',
    component: () => import('@/views/StocksPage.vue')
  },
  {
    path: '/',
    redirect: '/home'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
