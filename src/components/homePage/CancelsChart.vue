<script>
import { ref, watch } from 'vue'
import { Bar } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale 
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'CancelsChart',
  components: { Bar },
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
          label: 'Количество отмен',
          data: [5, 7, 10, 3, 4, 8, 6],
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1
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
            text: 'Количество отмен'
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
    <Bar 
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