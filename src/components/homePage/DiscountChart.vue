<script>
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

export default {
  name: 'DiscountChart',
  components: { Line },
  props: {
    chartData: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // Тестовые данные по умолчанию
    const defaultChartData = {
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      datasets: [
        {
          label: 'Средняя скидка, %',
          data: [15, 12, 18, 10, 8, 5, 9],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
            text: 'Скидка, %'
          },
          beginAtZero: true
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

    return {
      chartOptions,
      currentChartData
    }
  }
}
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