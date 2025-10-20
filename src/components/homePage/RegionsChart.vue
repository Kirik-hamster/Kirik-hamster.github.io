<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'RegionsChart',
  components: { Bar },
  data() {
    return {
      chartData: {
        labels: ['Нижегородская', 'Московская', 'Санкт-Петербург', 'Новосибирская', 'Свердловская'],
        datasets: [
          {
            label: 'Количество заказов',
            data: [150, 200, 95, 120, 80],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)'
            ],
            borderWidth: 1
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
              text: 'Регионы'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Количество заказов'
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
    <Bar 
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