<script>
import SalesChart from '@/components/homePage/SalesChart.vue'
import DiscountChart from '@/components/homePage/DiscountChart.vue'
import CancelsChart from '@/components/homePage/CancelsChart.vue'
import RegionsChart from '@/components/homePage/RegionsChart.vue'
import { useDashboardStore } from '@/stores/dashboard'

export default {
  name: 'MetricPage',
  components: {
    SalesChart,
    DiscountChart,
    CancelsChart,
    RegionsChart
  },
  data() {
    return {
      loading: false,
      chartData: null,
      allItemsData: [],
      dashboardStore: null,
      // Данные для пагинации
      currentPage: 1,
      itemsPerPage: 25,
      totalPages: 1
    }
  },
  computed: {
    metricId() {
      return this.$route.params.id
    },
    metricTitle() {
      const titles = {
        'sales': 'Динамика продаж',
        'discount': 'Средний процент скидки',
        'cancels': 'Уровень отмен',
        'regions': 'Распределение по регионам'
      }
      return titles[this.metricId] || 'Показатель'
    },
    currentChartComponent() {
      const components = {
        'sales': SalesChart,
        'discount': DiscountChart,
        'cancels': CancelsChart,
        'regions': RegionsChart
      }
      return components[this.metricId] || SalesChart
    },
    tableHeaders() {
      const headers = {
        'sales': ['Артикул', 'Текущая выручка', 'Предыдущая выручка', 'Изменение'],
        'discount': ['Артикул', 'Текущая скидка', 'Предыдущая скидка', 'Изменение'],
        'cancels': ['Артикул', 'Текущие отмены', 'Предыдущие отмены', 'Изменение'],
        'regions': ['Регион', 'Текущие заказы', 'Предыдущие заказы', 'Изменение']
      }
      return headers[this.metricId] || []
    },
    // Вычисляем данные для текущей страницы
    paginatedItems() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage
      const endIndex = startIndex + this.itemsPerPage
      return this.allItemsData.slice(startIndex, endIndex)
    },
    // Общее количество записей
    totalItems() {
      return this.allItemsData.length
    },
    // Номера страниц для отображения
    displayedPages() {
      const pages = []
      const maxVisiblePages = 5
      
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1)
      
      // Корректируем startPage, если endPage достиг максимума
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    }
  },
  methods: {
    getChangeClass(change) {
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return 'neutral-change'
    },
    formatValue(item, type) {
      if (this.metricId === 'sales') {
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(item)
      } else if (this.metricId === 'discount') {
        return Math.round(item * 10) / 10 + '%'
      } else {
        return item
      }
    },
    getCurrentValue(item) {
      const values = {
        'sales': item.current_revenue,
        'discount': item.current_discount,
        'cancels': item.current_cancellations,
        'regions': item.current_orders
      }
      return values[this.metricId] || 0
    },
    getPreviousValue(item) {
      const values = {
        'sales': item.previous_revenue,
        'discount': item.previous_discount,
        'cancels': item.previous_cancellations,
        'regions': item.previous_orders
      }
      return values[this.metricId] || 0
    },
    getChangeValue(item) {
      const changes = {
        'sales': item.revenue_change,
        'discount': item.discount_change,
        'cancels': item.cancellations_change,
        'regions': item.orders_change
      }
      return changes[this.metricId] || 0
    },
    async loadData() {
      this.loading = true
      try {
        // Получаем данные из store
        const comparisonData = await this.dashboardStore.getComparisonData()
        
        // Определяем какие данные использовать
        const dataSource = this.metricId === 'regions' 
          ? comparisonData.regions 
          : comparisonData.articles
        
        // Устанавливаем все данные для таблицы
        this.allItemsData = dataSource || []
        
        // Вычисляем общее количество страниц
        this.totalPages = Math.ceil(this.allItemsData.length / this.itemsPerPage)
        
        // Сбрасываем на первую страницу при загрузке новых данных
        this.currentPage = 1
        
        // Подготавливаем данные для графика
        this.prepareChartData()
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        this.loading = false
      }
    },
    prepareChartData() {
      const chartDataFromStore = this.metricId === 'regions' 
        ? this.dashboardStore.getRegionsChartData()
        : this.dashboardStore.getChartDataByDate()

      if (this.metricId === 'regions') {
        this.chartData = chartDataFromStore
        return
      }

      // Для остальных метрик формируем данные из агрегированных по датам
      let dataset = []
      let label = ''
      let color = ''

      switch (this.metricId) {
        case 'sales':
          dataset = chartDataFromStore.revenue
          label = 'Выручка, руб.'
          color = '#f87979'
          break
        case 'discount':
          dataset = chartDataFromStore.discount
          label = 'Средняя скидка, %'
          color = 'rgb(255, 99, 132)'
          break
        case 'cancels':
          dataset = chartDataFromStore.cancellations
          label = 'Количество отмен'
          color = 'rgb(255, 159, 64)'
          break
      }

      this.chartData = {
        labels: chartDataFromStore.labels,
        datasets: [{
          label: label,
          data: dataset,
          backgroundColor: color,
          borderColor: color,
          tension: 0.1
        }]
      }
    },
    getItemId(item) {
      return this.metricId === 'regions' ? item.region : item.nm_id
    },
    navigateToArticle(item) {
      if (this.metricId !== 'regions') {
        this.$router.push(`/article/${item.nm_id}`)
      }
    },
    // Методы для пагинации
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    // Метод для изменения количества элементов на странице
    changeItemsPerPage(count) {
      this.itemsPerPage = count
      this.totalPages = Math.ceil(this.allItemsData.length / this.itemsPerPage)
      this.currentPage = 1 // Сбрасываем на первую страницу
    }
  },
  async mounted() {
    this.dashboardStore = useDashboardStore()
    await this.loadData()
  },
  watch: {
    '$route.params.id': {
      handler() {
        this.loadData()
      },
      immediate: false
    }
  }
}
</script>

<template>
  <div class="metric-page">
    <div class="page-header">
      <h1>{{ metricTitle }}</h1>
      <p>Детальная информация по показателю</p>
      <button @click="$router.back()" class="back-btn">← Назад</button>
    </div>
    
    <div class="metric-content">
      <!-- График -->
      <div class="chart-section">
        <component 
          :is="currentChartComponent" 
          :chartData="chartData" 
          v-if="chartData"
        />
        <div v-else class="no-chart-data">
          Нет данных для отображения графика
        </div>
      </div>
      
      <!-- Таблица со всеми данными -->
      <div class="table-section">
        <div class="table-header">
          <h3>Все {{ metricId === 'regions' ? 'регионы' : 'артикулы' }}</h3>
          <div class="table-info">
            <span class="total-items">Всего записей: {{ totalItems }}</span>
            <div class="items-per-page">
              <label for="itemsPerPage">Элементов на странице:</label>
              <select 
                id="itemsPerPage" 
                v-model="itemsPerPage" 
                @change="changeItemsPerPage(parseInt($event.target.value))"
                class="page-select"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table class="articles-table">
            <thead>
              <tr>
                <th 
                  v-for="header in tableHeaders" 
                  :key="header"
                  :class="{ 'clickable': header === 'Артикул' && metricId !== 'regions' }"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="item in paginatedItems" 
                :key="getItemId(item)"
                :class="{ 'clickable-row': metricId !== 'regions' }"
                @click="navigateToArticle(item)"
              >
                <td>{{ getItemId(item) }}</td>
                <td>{{ formatValue(getCurrentValue(item)) }}</td>
                <td>{{ formatValue(getPreviousValue(item)) }}</td>
                <td :class="getChangeClass(getChangeValue(item))">
                  {{ Math.round(getChangeValue(item) * 10) / 10 }}% 
                  <span v-if="getChangeValue(item) > 0">↑</span>
                  <span v-else-if="getChangeValue(item) < 0">↓</span>
                </td>
              </tr>
              <tr v-if="paginatedItems.length === 0">
                <td :colspan="tableHeaders.length" class="no-data">
                  Нет данных для отображения
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="pagination" v-if="totalPages > 1">
          <div class="pagination-info">
            Показано {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, totalItems) }} из {{ totalItems }}
          </div>
          
          <div class="pagination-controls">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1" 
              class="pagination-btn"
            >
              ← Назад
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in displayedPages" 
                :key="page"
                @click="goToPage(page)"
                :class="{ 'active': page === currentPage }"
                class="page-btn"
              >
                {{ page }}
              </button>
              
              <span v-if="displayedPages[displayedPages.length - 1] < totalPages" class="page-ellipsis">
                ...
              </span>
            </div>
            
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages" 
              class="pagination-btn"
            >
              Вперед →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/styles/metric_page.css';
</style>