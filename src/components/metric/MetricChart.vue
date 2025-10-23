<template>
  <div class="chart-section">
    <component 
      :is="chartComponent" 
      :chartData="chartData" 
      v-if="chartData"
    />
    <div v-else class="no-chart-data">
      Нет данных для отображения графика
    </div>
  </div>
</template>

<script>
import SalesChart from '@/components/homePage/SalesChart.vue'
import DiscountChart from '@/components/homePage/DiscountChart.vue'
import CancelsChart from '@/components/homePage/CancelsChart.vue'
import RegionsChart from '@/components/homePage/RegionsChart.vue'

const components = {
  SalesChart,
  DiscountChart,
  CancelsChart,
  RegionsChart
}

export default {
  name: 'MetricChart',
  components,
  props: {
    chartData: {
      type: Object,
      default: null
    },
    chartComponent: {
      type: String,
      required: true
    }
  }
}
</script>

<style scoped>
@import '@/styles/metric/metric_chart.css';
</style>