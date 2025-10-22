<script>
import SalesChart from '@/components/homePage/SalesChart.vue'
import DiscountChart from '@/components/homePage/DiscountChart.vue';
import CancelsChart from '@/components/homePage/CancelsChart.vue';
import RegionsChart from '@/components/homePage/RegionsChart.vue';
import { useDashboardStore } from '@/stores/dashboard';

export default {
  name: 'HomePage',  
  components: {
    SalesChart, DiscountChart, CancelsChart, RegionsChart
  },
  data() {
    return {
      loading: false,
      dataLoaded: false, // Новый флаг для отслеживания загрузки данных
      // Пустые данные вместо тестовых
      salesData: [],
      discountData: [],
      cancelsData: [],
      regionsData: [],
      // Данные для графиков
      revenueChartData: null,
      discountChartData: null,
      cancellationsChartData: null,
      regionsChartData: null 
    }
  },
  methods: {
    getChangeClass(change) {
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return 'neutral-change'
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
      }).format(amount)
    },
    // Метод для загрузки и отображения реальных данных
    async loadRealData(forceRefresh = false) {
      this.loading = true
      this.dataLoaded = false

      try {
        const dashboardStore = useDashboardStore()
        
        // Принудительное обновление очищает кэш
        if (forceRefresh) {
          dashboardStore.clearCache()
        }
        
        const comparisonData = await dashboardStore.getComparisonData(forceRefresh)
        
        console.log('=== ДАННЫЕ ЗАГРУЖЕНЫ ===', forceRefresh ? '(принудительно)' : '(из кэша)')
        
        // Получаем данные для графиков (агрегация по датам)
        const chartData = dashboardStore.getChartDataByDate()
        this.prepareChartData(chartData)

        // Получаем данные для графика регионов
        const regionsChartData = dashboardStore.getRegionsChartData()
        this.regionsChartData = regionsChartData

        // Извлекаем данные статей и регионов из comparisonData
        const articles = comparisonData.articles || []
        const regions = comparisonData.regions || []

        // Сортируем по разным показателям для таблиц и берем топ-3
        const topByRevenue = [...articles]
          .sort((a, b) => b.revenue_change - a.revenue_change)
          .slice(0, 3)
          .map(item => ({
            nm_id: item.nm_id,
            current_revenue: Math.round(item.current_revenue),
            previous_revenue: Math.round(item.previous_revenue),
            revenue_change: Math.round(item.revenue_change * 10) / 10
          }))
        
        const topByDiscount = [...articles]
          .sort((a, b) => b.discount_change - a.discount_change)
          .slice(0, 3)
          .map(item => ({
            nm_id: item.nm_id,
            current_discount: Math.round(item.current_discount * 10) / 10,
            previous_discount: Math.round(item.previous_discount * 10) / 10,
            discount_change: Math.round(item.discount_change * 10) / 10
          }))
        
        const topByCancellations = [...articles]
          .sort((a, b) => b.cancellations_change - a.cancellations_change)
          .slice(0, 3)
          .map(item => ({
            nm_id: item.nm_id,
            current_cancels: item.current_cancellations,
            previous_cancels: item.previous_cancellations,
            cancel_change: Math.round(item.cancellations_change * 10) / 10
          }))
        
        // Топ регионов по изменению количества заказов
        const topRegions = [...regions]
          .sort((a, b) => b.orders_change - a.orders_change)
          .slice(0, 3)
          .map(item => ({
            region: item.region,
            current_orders: item.current_orders,
            previous_orders: item.previous_orders,
            order_change: Math.round(item.orders_change * 10) / 10
          }))
        
        // Обновляем данные таблиц
        this.salesData = topByRevenue
        this.discountData = topByDiscount
        this.cancelsData = topByCancellations
        this.regionsData = topRegions

        this.dataLoaded = true
        console.log('Данные таблиц обновлены!')
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        // Можно добавить уведомление об ошибке для пользователя
      } finally {
        this.loading = false
      }
    },
    prepareChartData(chartData) {
      // График выручки
      this.revenueChartData = {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Выручка, руб.',
            data: chartData.revenue,
            backgroundColor: '#f87979',
            borderColor: '#f87979',
            tension: 0.1
          }
        ]
      }

      // График скидок
      this.discountChartData = {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Средняя скидка, %',
            data: chartData.discount,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      }

      // График отмен
      this.cancellationsChartData = {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Количество отмен',
            data: chartData.cancellations,
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1
          }
        ]
      }   
    } 
  },
  mounted() {
    // При загрузке страницы можно сразу загрузить данные
    this.loadRealData(false)
  }
}
</script>

<template>
  <div class="home-page">
    <!-- Красивая анимация загрузки -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
        <div class="loading-text">
          <h3>Загрузка аналитики Wildberries</h3>
          <p>Собираем данные о продажах, скидках и отменах...</p>
        </div>
      </div>
    </div>

    <div v-if="dataLoaded" class="page-content">
      <div class="page-header">
        <h1>Аналитическая панель Wildberries</h1>
        <p>Обзор ключевых показателей на основе данных заказов</p>
      
        <!-- КНОПКА ДЛЯ ПЕРЕЗАГРУЗКИ ДАННЫХ -->
        <button 
          @click="loadRealData" 
          :disabled="loading" 
          class="test-button"
          :class="{ 'loading': loading }"
        >
          <span v-if="loading">🔄 Обновление...</span>
          <span v-else>🔄 Обновить данные</span>
        </button>
        
        <div v-if="loading" class="loading-message">
          Идёт загрузка данных с API. Подождите пожалуйста...
        </div>
      </div>
      
      <div class="metrics-grid">
        <!-- Динамика продаж -->
        <div class="metric-card">
          <div class="chart-container" @click="$router.push('/metric/sales')">
            <h3>Динамика продаж</h3>
              <SalesChart :chartData="revenueChartData" />
          </div>
          <div class="table-container">
            <h4>Топ артикулов по выручке</h4>
            <table class="articles-table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Текущая выручка</th>
                  <th>Предыдущая выручка</th>
                  <th>Изменение</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in salesData" 
                  :key="item.nm_id" 
                  @click="$router.push(`/article/${item.nm_id}`)"
                  class="data-row"
                >
                  <td>{{ item.nm_id }}</td>
                  <td>{{ formatCurrency(item.current_revenue) }}</td>
                  <td>{{ formatCurrency(item.previous_revenue) }}</td>
                  <td :class="getChangeClass(item.revenue_change)">
                    {{ item.revenue_change }}% 
                    <span v-if="item.revenue_change > 0">↑</span>
                    <span v-else-if="item.revenue_change < 0">↓</span>
                  </td>
                </tr>
                <tr v-if="salesData.length === 0">
                  <td colspan="4" class="no-data">Нажмите кнопку для загрузки данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Средние скидки -->
        <div class="metric-card">
          <div class="chart-container" @click="$router.push('/metric/discount')">
            <h3>Средний процент скидки</h3>
              <DiscountChart :chartData="discountChartData" />
          </div>
          <div class="table-container">
            <h4>Топ артикулов по скидкам</h4>
            <table class="articles-table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Текущая скидка</th>
                  <th>Предыдущая скидка</th>
                  <th>Изменение</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in discountData" 
                  :key="item.nm_id" 
                  @click="$router.push(`/article/${item.nm_id}`)"
                  class="data-row"
                >
                  <td>{{ item.nm_id }}</td>
                  <td>{{ item.current_discount }}%</td>
                  <td>{{ item.previous_discount }}%</td>
                  <td :class="getChangeClass(item.discount_change)">
                    {{ item.discount_change }}% 
                    <span v-if="item.discount_change > 0">↑</span>
                    <span v-else-if="item.discount_change < 0">↓</span>
                  </td>
                </tr>
                <tr v-if="discountData.length === 0">
                  <td colspan="4" class="no-data">Нажмите кнопку для загрузки данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Отмены -->
        <div class="metric-card">
          <div class="chart-container" @click="$router.push('/metric/cancels')">
            <h3>Уровень отмен</h3>
              <CancelsChart :chartData="cancellationsChartData" />
          </div>
          <div class="table-container">
            <h4>Топ артикулов по отменам</h4>
            <table class="articles-table">
              <thead>
                <tr>
                  <th>Артикул</th>
                  <th>Текущие отмены</th>
                  <th>Предыдущие отмены</th>
                  <th>Изменение</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in cancelsData" 
                  :key="item.nm_id" 
                  @click="$router.push(`/article/${item.nm_id}`)"
                  class="data-row"
                >
                  <td>{{ item.nm_id }}</td>
                  <td>{{ item.current_cancels }}</td>
                  <td>{{ item.previous_cancels }}</td>
                  <td :class="getChangeClass(item.cancel_change)">
                    {{ item.cancel_change }}% 
                    <span v-if="item.cancel_change > 0">↑</span>
                    <span v-else-if="item.cancel_change < 0">↓</span>
                  </td>
                </tr>
                <tr v-if="cancelsData.length === 0">
                  <td colspan="4" class="no-data">Нажмите кнопку для загрузки данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Регионы (пока оставляем тестовые) -->
        <div class="metric-card">
          <div class="chart-container" @click="$router.push('/metric/regions')">
            <h3>Распределение по регионам</h3>
            <RegionsChart :chartData="regionsChartData" />
          </div>
          <div class="table-container">
            <h4>Топ регионов по заказам</h4>
            <table class="articles-table">
              <thead>
                <tr>
                  <th>Регион</th>
                  <th>Текущие заказы</th>
                  <th>Предыдущие заказы</th>
                  <th>Изменение</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in regionsData" :key="item.region">
                  <td>{{ item.region }}</td>
                  <td>{{ item.current_orders }}</td>
                  <td>{{ item.previous_orders }}</td>
                  <td :class="getChangeClass(item.order_change)">
                    {{ item.order_change }}% 
                    <span v-if="item.order_change > 0">↑</span>
                    <span v-else-if="item.order_change < 0">↓</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
@import '@/styles/home_page.css';
</style>