<script>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

export default {
  name: 'DiscountChart',
  components: { Line },
  data() {
    return {
      chartData: {
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
      },
      chartOptions: {
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
      }
    }
  }
}
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
  height: 200px;
}
</style>