<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard/dashboard'
import { useMetricData } from '@/composables/useMetricData'

// Components
import FiltersPanel from '@/components/FiltersPanel.vue'
import MetricHeader from '@/components/metric/MetricHeader.vue'
import MetricChart from '@/components/metric/MetricChart.vue'
import MetricTable from '@/components/metric/MetricTable.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

export default {
  name: 'MetricPage',
  components: {
    FiltersPanel,
    MetricHeader,
    MetricChart,
    MetricTable,
    LoadingSpinner
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const dashboardStore = useDashboardStore()
    
    const metricId = ref(route.params.id)
    const { loading, chartData, allItemsData, config, loadData, getItemId } = useMetricData(metricId.value)

    // Обработчик клика по строке таблицы
    const handleRowClick = (item) => {
      if (metricId.value !== 'regions') {
        router.push(`/article/${item.nm_id}`)
      }
    }

    // Загрузка данных при монтировании
    onMounted(async () => {
      await loadData()
    })

    // Следим за изменениями фильтров
    watch(
      () => dashboardStore.filters,
      () => {
        loadData()
      },
      { deep: true }
    )

    // Следим за изменением метрики в URL
    watch(
      () => route.params.id,
      (newMetricId) => {
        metricId.value = newMetricId
        loadData()
      }
    )

    return {
      metricId,
      loading,
      chartData,
      allItemsData,
      config,
      getItemId,
      handleRowClick
    }
  }
}
</script>

<template>
  <div class="metric-page">
    <LoadingSpinner 
      :loading="loading" 
      :title="`Загрузка данных: ${config.title}`"
      :message="'Подготавливаем графики и таблицы...'"
    />

    <MetricHeader :title="config.title" />
    
    <!-- Панель фильтров -->
    <FiltersPanel />
    
    <div class="metric-content">
      <!-- График -->
      <MetricChart 
        :chartData="chartData" 
        :chartComponent="config.chartComponent" 
      />
      
      <!-- Таблица со всеми данными -->
      <MetricTable
        :items="allItemsData"
        :tableHeaders="config.tableHeaders"
        :valueFields="config.valueFields"
        :isRegions="metricId === 'regions'"
        :getItemId="getItemId"
        @rowClick="handleRowClick"
      />
    </div>
  </div>
</template>

<style scoped>
@import '@/styles/metric/metric_page.css';
</style>