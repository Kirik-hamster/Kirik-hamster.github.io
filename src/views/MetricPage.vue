<script>
import SalesChart from '@/components/homePage/SalesChart.vue'
import DiscountChart from '@/components/homePage/DiscountChart.vue'
import CancelsChart from '@/components/homePage/CancelsChart.vue'
import RegionsChart from '@/components/homePage/RegionsChart.vue'

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
      allItemsData: []
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
    }
  },
  methods: {
    getChangeClass(change) {
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return 'neutral-change'
    },
    formatValue(value) {
      if (this.metricId === 'sales') {
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(value)
      } else if (this.metricId === 'discount') {
        return value + '%'
      } else {
        return value
      }
    },
    loadAllItemsData() {
      // Тестовые данные для всех товаров
      if (this.metricId === 'sales') {
        this.allItemsData = [
          { nm_id: 763665926, current: 640270, previous: 450000, change: 42.3 },
          { nm_id: 763665927, current: 520000, previous: 480000, change: 8.3 },
          { nm_id: 763665928, current: 380000, previous: 420000, change: -9.5 },
          { nm_id: 763665929, current: 500000, previous: 400000, change: 25.0 },
          { nm_id: 763665930, current: 300000, previous: 350000, change: -14.3 }
        ]
      } else if (this.metricId === 'discount') {
        this.allItemsData = [
          { nm_id: 763665926, current: 91, previous: 85, change: 7.1 },
          { nm_id: 763665927, current: 75, previous: 80, change: -6.3 },
          { nm_id: 763665928, current: 60, previous: 55, change: 9.1 },
          { nm_id: 763665929, current: 50, previous: 45, change: 11.1 },
          { nm_id: 763665930, current: 40, previous: 50, change: -20.0 }
        ]
      } else if (this.metricId === 'cancels') {
        this.allItemsData = [
          { nm_id: 763665926, current: 5, previous: 8, change: -37.5 },
          { nm_id: 763665927, current: 12, previous: 10, change: 20.0 },
          { nm_id: 763665928, current: 3, previous: 2, change: 50.0 },
          { nm_id: 763665929, current: 7, previous: 5, change: 40.0 },
          { nm_id: 763665930, current: 2, previous: 4, change: -50.0 }
        ]
      } else if (this.metricId === 'regions') {
        this.allItemsData = [
          { nm_id: 763665926, current: 150, previous: 120, change: 25.0 },
          { nm_id: 763665927, current: 200, previous: 180, change: 11.1 },
          { nm_id: 763665928, current: 95, previous: 110, change: -13.6 },
          { nm_id: 763665929, current: 120, previous: 100, change: 20.0 },
          { nm_id: 763665930, current: 80, previous: 90, change: -11.1 }
        ]
      }
    }
  },
  mounted() {
    this.loadAllItemsData()
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
        <component :is="currentChartComponent" />
      </div>
      
      <!-- Таблица со всеми товарами -->
      <div class="table-section">
        <h3>Все артикулы</h3>
        <table class="articles-table">
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Текущий период</th>
              <th>Предыдущий период</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in allItemsData" :key="item.nm_id" @click="$router.push(`/article/${item.nm_id}`)">
              <td>{{ item.nm_id }}</td>
              <td>{{ formatValue(item.current) }}</td>
              <td>{{ formatValue(item.previous) }}</td>
              <td :class="getChangeClass(item.change)">
                {{ item.change }}% 
                <span v-if="item.change > 0">↑</span>
                <span v-else-if="item.change < 0">↓</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>



<style scoped>
@import '@/styles/metric_page.css';
</style>