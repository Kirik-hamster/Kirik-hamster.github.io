<template>
  <div class="app-container">
    <!-- Боковая панель навигации -->
    <aside class="sidebar">
      <div class="logo">
        <router-link to="/home" class="nav-item">
          <h2>My SPA</h2>
        </router-link>
      </div>
      <nav class="nav-menu">
        <router-link to="/orders" class="nav-item">
          <span class="icon">📦</span>
          <span class="text">Заказы</span>
        </router-link>
        <router-link to="/incomes" class="nav-item">
          <span class="icon">💰</span>
          <span class="text">Доходы</span>
        </router-link>
        <router-link to="/sales" class="nav-item">
          <span class="icon">📊</span>
          <span class="text">Продажи</span>
        </router-link>
        <router-link to="/stocks" class="nav-item">
          <span class="icon">🏭</span>
          <span class="text">Склады</span>
        </router-link>
      </nav>
    </aside>

    <!-- Основная область контента -->
    <div class="main-content">
      <!-- Заголовок с названием приложения и текущим разделом -->
      <header class="main-header">
        <div class="header-content">
          <h1>My SPA Application</h1>
          <div class="current-page">
            <span class="current-path">{{ currentPath }}</span>
            <span class="current-title">{{ currentTitle }}</span>
          </div>
        </div>
      </header>
      
      <!-- Контейнер для отображения страниц -->
      <main class="content-area">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    
    const currentPath = computed(() => route.path)
    
    const currentTitle = computed(() => {
      const titles = {
        '/': 'Главная',
        '/home': 'Главная',
        '/orders': 'Заказы',
        '/incomes': 'Доходы',
        '/sales': 'Продажи', 
        '/stocks': 'Склады',
        '/metric/sales': 'Метрика продаж',
        '/metric/discount': 'Метрика скидок',
        '/metric/cancels': 'Метрика отмен',
        '/metric/regions': 'Метрика регионов',
        '/article': 'Артикул'
      }
      
      if (route.path.startsWith('/article/')) {
        return 'Артикул'
      }
      
      return titles[route.path] || 'Панель управления'
    })
    
    return {
      currentPath,
      currentTitle
    }
  }
}
</script>

<style>
@import '@/styles/app_main.css';
</style>