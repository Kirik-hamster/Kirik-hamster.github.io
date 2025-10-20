<script>
import SalesChart from '@/components/homePage/SalesChart.vue'
import DiscountChart from '@/components/homePage/DiscountChart.vue';
import CancelsChart from '@/components/homePage/CancelsChart.vue';
import RegionsChart from '@/components/homePage/RegionsChart.vue';
export default {
  name: 'HomePage',  components: {
    SalesChart, DiscountChart, CancelsChart, RegionsChart
  },
  data() {
    return {
      // Тестовые данные, основанные на реальной структуре API
      salesData: [
        { nm_id: 763665926, current_revenue: 640270, previous_revenue: 450000, revenue_change: 42.3 },
        { nm_id: 763665927, current_revenue: 520000, previous_revenue: 480000, revenue_change: 8.3 },
        { nm_id: 763665928, current_revenue: 380000, previous_revenue: 420000, revenue_change: -9.5 }
      ],
      discountData: [
        { nm_id: 763665926, current_discount: 91, previous_discount: 85, discount_change: 7.1 },
        { nm_id: 763665927, current_discount: 75, previous_discount: 80, discount_change: -6.3 },
        { nm_id: 763665928, current_discount: 60, previous_discount: 55, discount_change: 9.1 }
      ],
      cancelsData: [
        { nm_id: 763665926, current_cancels: 5, previous_cancels: 8, cancel_change: -37.5 },
        { nm_id: 763665927, current_cancels: 12, previous_cancels: 10, cancel_change: 20.0 },
        { nm_id: 763665928, current_cancels: 3, previous_cancels: 2, cancel_change: 50.0 }
      ],
      regionsData: [
        { region: 'Нижегородская область', current_orders: 150, previous_orders: 120, order_change: 25.0 },
        { region: 'Московская область', current_orders: 200, previous_orders: 180, order_change: 11.1 },
        { region: 'Санкт-Петербург', current_orders: 95, previous_orders: 110, order_change: -13.6 }
      ]
    }
  },
  methods: {
    getChangeClass(change) {
      // Для отмен и скидок логика может быть обратной
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return 'neutral-change'
    },
    formatCurrency(amount) {
      // Форматирование валюты для отображения
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
      }).format(amount)
    }
  }
}
</script>

<template>
  <div class="home-page">
    <div class="page-header">
      <h1>Аналитическая панель Wildberries (пока без данных от api)</h1>
      <p>Обзор ключевых показателей на основе данных заказов</p>
    </div>
    
    <div class="metrics-grid">
      <!-- Динамика продаж -->
      <div class="metric-card">
        <div class="chart-container" @click="$router.push('/metric/sales')">
          <h3>Динамика продаж</h3>
            <SalesChart />
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
              <tr v-for="item in salesData" :key="item.nm_id" @click="$router.push(`/article/${item.nm_id}`)">
                <td>{{ item.nm_id }}</td>
                <td>{{ formatCurrency(item.current_revenue) }}</td>
                <td>{{ formatCurrency(item.previous_revenue) }}</td>
                <td :class="getChangeClass(item.revenue_change)">
                  {{ item.revenue_change }}% 
                  <span v-if="item.revenue_change > 0">↑</span>
                  <span v-else-if="item.revenue_change < 0">↓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Средние скидки -->
      <div class="metric-card">
        <div class="chart-container" @click="$router.push('/metric/discount')">
          <h3>Средний процент скидки</h3>
            <DiscountChart />
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
              <tr v-for="item in discountData" :key="item.nm_id" @click="$router.push(`/article/${item.nm_id}`)">
                <td>{{ item.nm_id }}</td>
                <td>{{ item.current_discount }}%</td>
                <td>{{ item.previous_discount }}%</td>
                <td :class="getChangeClass(item.discount_change)">
                  {{ item.discount_change }}% 
                  <span v-if="item.discount_change > 0">↑</span>
                  <span v-else-if="item.discount_change < 0">↓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Отмены -->
      <div class="metric-card">
        <div class="chart-container" @click="$router.push('/metric/cancels')">
          <h3>Уровень отмен</h3>
            <CancelsChart />
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
              <tr v-for="item in cancelsData" :key="item.nm_id" @click="$router.push(`/article/${item.nm_id}`)">
                <td>{{ item.nm_id }}</td>
                <td>{{ item.current_cancels }}</td>
                <td>{{ item.previous_cancels }}</td>
                <td :class="getChangeClass(item.cancel_change)">
                  {{ item.cancel_change }}% 
                  <span v-if="item.cancel_change > 0">↑</span>
                  <span v-else-if="item.cancel_change < 0">↓</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Регионы -->
      <div class="metric-card">
        <div class="chart-container" @click="$router.push('/metric/regions')">
          <h3>Распределение по регионам</h3>
          <RegionsChart />
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
</template>

<style>
@import '@/styles/home_page.css';
</style>