<template>
  <div class="article-page">
    <div class="page-header">
      <h1>Артикул {{ articleId }}</h1>
      <button @click="$router.back()" class="back-btn">← Назад</button>
    </div>
    
    <div class="article-content">
      <!-- Левая часть - информация (1/3 ширины) -->
      <div class="article-info">
        <div class="image-placeholder">
          <span>🖼️ Заглушка фотокарточки для артикула {{ articleId }}</span>
        </div>
        <div class="article-details">
          <h3>Информация об артикуле</h3>
          <p><strong>Артикул:</strong> {{ articleId }}</p>
          <p><strong>Бренд:</strong> {{ articleData.brand || 'Не указан' }}</p>
          <p><strong>Категория:</strong> {{ articleData.category || 'Не указана' }}</p>
          <p><strong>Размер:</strong> {{ articleData.size || 'Не указан' }}</p>
          <p><strong>Регион:</strong> {{ articleData.region || 'Не указан' }}</p>
        </div>
      </div>
      
      <!-- Правая часть - таблица показателей (2/3 ширины) -->
      <div class="metrics-table">
        <h3>Показатели по датам</h3>
        <div v-if="loading" class="loading-message">
          Загрузка данных...
        </div>
        <div v-else-if="Object.keys(metricsData).length === 0" class="no-data-message">
          Нет данных для отображения
        </div>
        <table v-else class="metrics-data">
          <thead>
            <tr>
              <th>Показатель</th>
              <th v-for="date in dates" :key="date">{{ formatDate(date) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Продажи (шт.)</strong></td>
              <td v-for="date in dates" :key="date" :class="getValueClass(metricsData[date]?.sales)">
                {{ metricsData[date]?.sales || '-' }}
              </td>
            </tr>
            <tr>
              <td><strong>Выручка (руб.)</strong></td>
              <td v-for="date in dates" :key="date" :class="getValueClass(metricsData[date]?.revenue)">
                {{ formatMetricValue('revenue', metricsData[date]?.revenue) }}
              </td>
            </tr>
            <tr>
              <td><strong>Скидка (%)</strong></td>
              <td v-for="date in dates" :key="date" :class="getValueClass(metricsData[date]?.discount)">
                {{ formatMetricValue('discount', metricsData[date]?.discount) }}
              </td>
            </tr>
            <tr>
              <td><strong>Отмены (шт.)</strong></td>
              <td v-for="date in dates" :key="date" :class="getValueClass(metricsData[date]?.cancellations)">
                {{ metricsData[date]?.cancellations || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { useDashboardStore } from '@/stores/dashboard/dashboard'

export default {
  name: 'ArticlePage',
  data() {
    return {
      loading: false,
      articleData: {},
      metricsData: {},
      dates: [],
      dashboardStore: null
    }
  },
  computed: {
    articleId() {
      return this.$route.params.id
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      })
    },
    formatMetricValue(metricName, value) {
      if (!value && value !== 0) return '-'
      if (metricName === 'revenue') {
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(value)
      } else if (metricName === 'discount') {
        return Math.round(value * 10) / 10 + '%'
      }
      return value
    },
    getValueClass(value) {
      if (!value && value !== 0) return 'no-data'
      return 'has-data'
    },
    async loadArticleData() {
      this.loading = true
      try {
        // Получаем данные из store
        await this.dashboardStore.getComparisonData()
        
        // Получаем все заказы за обе недели
        const allOrders = [
          ...this.dashboardStore.currentWeekOrders,
          ...this.dashboardStore.previousWeekOrders
        ]
        
        // Фильтруем заказы по артикулу
        const articleOrders = allOrders.filter(order => order.nm_id == this.articleId)
        
        if (articleOrders.length > 0) {
          // Берем данные из первого заказа для информации об артикуле
          const firstOrder = articleOrders[0]
          this.articleData = {
            brand: firstOrder.brand || 'Не указан',
            category: firstOrder.category || 'Не указана',
            size: 'Не указан',
            region: 'Не указан'
          }
          
          // Группируем данные по датам
          this.processMetricsData(articleOrders)
        }
        
      } catch (error) {
        console.error('Ошибка загрузки данных артикула:', error)
      } finally {
        this.loading = false
      }
    },
    processMetricsData(orders) {
      const metricsByDate = {}
      
      // Получаем все уникальные даты из заказов
      orders.forEach(order => {
        const orderDate = new Date(order.date)
        const dateKey = orderDate.toISOString().split('T')[0]
        
        if (!metricsByDate[dateKey]) {
          metricsByDate[dateKey] = {
            sales: 0,
            revenue: 0,
            discountSum: 0,
            discountCount: 0,
            cancellations: 0
          }
        }
        
        const dayData = metricsByDate[dateKey]
        
        if (!order.is_cancel) {
          // Не отмененный заказ
          dayData.sales++
          dayData.revenue += parseFloat(order.total_price) || 0
          dayData.discountSum += order.discount_percent || 0
          dayData.discountCount++
        } else {
          // Отмененный заказ
          dayData.cancellations++
        }
      })
      
      // Вычисляем среднюю скидку для каждого дня
      Object.keys(metricsByDate).forEach(date => {
        const dayData = metricsByDate[date]
        if (dayData.discountCount > 0) {
          dayData.discount = dayData.discountSum / dayData.discountCount
        } else {
          dayData.discount = 0
        }
        // Удаляем временные поля
        delete dayData.discountSum
        delete dayData.discountCount
      })
      
      // Сортируем даты в хронологическом порядке
      this.dates = Object.keys(metricsByDate).sort()
      this.metricsData = metricsByDate
    }
  },
  async mounted() {
    this.dashboardStore = useDashboardStore()
    await this.loadArticleData()
  },
  watch: {
    '$route.params.id': {
      handler() {
        this.loadArticleData()
      },
      immediate: false
    }
  }
}
</script>

<style scoped>
@import '@/styles/article_page.css';
</style>