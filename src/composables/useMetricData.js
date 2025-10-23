import { ref, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard/dashboard'
import { metricConfig } from '@/utils/metricConfig'

export const useMetricData = (metricId) => {
  const dashboardStore = useDashboardStore()
  const loading = ref(false)
  const chartData = ref(null)
  const allItemsData = ref([])

  const config = computed(() => metricConfig[metricId] || metricConfig.sales)

  const loadData = async () => {
    loading.value = true
    try {
      const comparisonData = await dashboardStore.getComparisonData()
      
      const dataSource = metricId === 'regions' 
        ? comparisonData.regions 
        : comparisonData.articles
      
      allItemsData.value = dataSource || []
      prepareChartData()
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      loading.value = false
    }
  }

  const prepareChartData = () => {
    if (metricId === 'regions') {
      chartData.value = dashboardStore.getRegionsChartData()
      return
    }

    const chartDataFromStore = dashboardStore.getChartDataByDate()
    const { dataset, label, color } = config.value.chartConfig

    chartData.value = {
      labels: chartDataFromStore.labels,
      datasets: [{
        label,
        data: chartDataFromStore[dataset],
        backgroundColor: color,
        borderColor: color,
        tension: 0.1
      }]
    }
  }

  const getItemId = (item) => {
    return metricId === 'regions' ? item.region : item.nm_id
  }

  return {
    loading,
    chartData,
    allItemsData,
    config,
    loadData,
    getItemId
  }
}