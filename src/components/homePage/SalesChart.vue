<script setup>
import { ref, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  PointElement, 
  CategoryScale, 
  LinearScale 
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: {
    type: Object,
    default: null
  }
})

// Тестовые данные по умолчанию
const defaultChartData = {
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  datasets: [
    {
      label: 'Выручка, руб.',
      data: [120000, 190000, 150000, 250000, 220000, 300000, 280000],
      backgroundColor: '#f87979',
      borderColor: '#f87979',
      tension: 0.1
    }
  ]
}

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: {
        display: true,
        text: 'Дни недели'
      }
    },
    y: {
      title: {
        display: true,
        text: 'Выручка, руб.'
      }
    }
  }
})

// Реактивные данные для графика
const currentChartData = ref(defaultChartData)

watch(() => props.chartData, (newData) => {
  if (newData) {
    currentChartData.value = newData
  }
}, { immediate: true })
</script>

<template>
  <div class="chart-container">
    <Line 
      :data="currentChartData" 
      :options="chartOptions"
    />
  </div>
</template>

<style scoped>
.chart-container {
  height: 200px;
}
</style>