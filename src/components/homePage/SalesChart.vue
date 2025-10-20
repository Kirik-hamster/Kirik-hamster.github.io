<script setup>
import { ref } from 'vue'
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

// Тестовые данные для графика продаж
const chartData = {
  labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  datasets: [
    {
      label: 'Выручка, руб.',
      data: [120000, 190000, 150000, 250000, 220000, 300000, 280000],
      backgroundColor: '#f87979',
      borderColor: '#f87979', // ДОБАВЬТЕ ЭТУ СТРОКУ
      tension: 0.1 // ДОБАВЬТЕ ЭТУ СТРОКУ
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
</script>

<template>
  <div class="chart-container">
    <Line 
      :data="chartData" 
      :options="chartOptions"
    />
  </div>
</template>

<style scoped>
.chart-container {
  height: 200px; /* ЯВНО УКАЖИТЕ ВЫСОТУ */
  height: 100%;
}
</style>