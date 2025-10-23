<template>
  <div class="filters-panel">
    <div class="filters-header">
      <h3>Фильтры</h3>
      <button @click="clearFilters" class="clear-filters-btn">
        Очистить все
      </button>
    </div>
    
    <div class="filters-grid">
      <!-- Фильтр по артикулу -->
      <div class="filter-group">
        <label for="nm_id">Артикул</label>
        <input
          id="nm_id"
          v-model="localFilters.nm_id"
          type="text"
          placeholder="Введите артикул"
          @input="updateFilter('nm_id', $event.target.value)"
        />
      </div>

      <!-- Фильтр по региону -->
      <div class="filter-group">
        <label for="region">Регион</label>
        <select
          id="region"
          v-model="localFilters.region"
          @change="updateFilter('region', $event.target.value)"
        >
          <option value="">Все регионы</option>
          <option v-for="region in filterOptions.regions" :key="region" :value="region">
            {{ region }}
          </option>
        </select>
      </div>

      <!-- Фильтр по категории -->
      <div class="filter-group">
        <label for="category">Категория</label>
        <select
          id="category"
          v-model="localFilters.category"
          @change="updateFilter('category', $event.target.value)"
        >
          <option value="">Все категории</option>
          <option v-for="category in filterOptions.categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <!-- Фильтр по бренду -->
      <div class="filter-group">
        <label for="brand">Бренд</label>
        <select
          id="brand"
          v-model="localFilters.brand"
          @change="updateFilter('brand', $event.target.value)"
        >
          <option value="">Все бренды</option>
          <option v-for="brand in filterOptions.brands" :key="brand" :value="brand">
            {{ brand }}
          </option>
        </select>
      </div>

      <!-- Фильтр по периоду (заменяем даты) -->
      <div class="filter-group">
        <label for="period">Период сравнения</label>
        <select
          id="period"
          v-model="localFilters.period"
          @change="updateFilter('period', $event.target.value)"
        >
          <option value="2">2 дня</option>
          <option value="3">3 дня</option>
          <option value="4">4 дня</option>
          <option value="5">5 дней</option>
          <option value="6">6 дней</option>
          <option value="7" selected>7 дней</option>
        </select>
      </div>
    </div>

    <!-- Индикатор активных фильтров -->
    <div v-if="activeFiltersCount > 0" class="active-filters">
      <span class="active-filters-count">
        Активных фильтров: {{ activeFiltersCount }}
      </span>
      <div v-if="periodInfo" class="period-info">
        Сравниваем: {{ periodInfo.currentStart }} - {{ periodInfo.currentEnd }} 
        vs {{ periodInfo.previousStart }} - {{ periodInfo.previousEnd }}
        ({{ periodInfo.daysCount }} дней)
      </div>
    </div>
  </div>
</template>

<script>
import { useDashboardStore } from '@/stores/dashboard/dashboard'

export default {
  name: 'FiltersPanel',
  data() {
    return {
      localFilters: {
        nm_id: '',
        region: '',
        category: '',
        brand: '',
        period: 7 // По умолчанию 7 дней
      },
      filterOptions: {
        regions: [],
        categories: [],
        brands: []
      },
      dashboardStore: null,
      periodInfo: null
    }
  },
  computed: {
    activeFiltersCount() {
      const filters = { ...this.localFilters }
      let count = 0
      Object.keys(filters).forEach(key => {
        // Не считаем период по умолчанию (7) как активный фильтр
        if (key === 'period') {
          if (filters[key] !== 7) {
            count++
          }
        } else if (filters[key] !== '') {
          count++
        }
      })
      return count
    }
  },
  methods: {
    updateFilter(type, value) {
      if (this.dashboardStore) {
        // Преобразуем period в число
        if (type === 'period') {
          value = parseInt(value)
        }
        this.dashboardStore.setFilter(type, value)
      }
    },
    clearFilters() {
      this.localFilters = {
        nm_id: '',
        region: '',
        category: '',
        brand: '',
        period: 7
      }
      
      if (this.dashboardStore) {
        this.dashboardStore.clearFilters()
      }
    },
    loadFilterOptions() {
      if (this.dashboardStore) {
        this.filterOptions = this.dashboardStore.getFilterOptions()
      }
    },
    syncWithStore() {
      if (this.dashboardStore && this.dashboardStore.filters) {
        this.localFilters = { ...this.dashboardStore.filters }
      }
    },
    // Обновить информацию о периоде
    async updatePeriodInfo() {
      if (this.dashboardStore && this.dashboardStore.getComparisonData) {
        try {
          const comparisonData = await this.dashboardStore.getComparisonData()
          if (comparisonData && comparisonData.periodInfo) {
            this.periodInfo = comparisonData.periodInfo
          }
        } catch (error) {
          console.error('Ошибка получения информации о периоде:', error)
        }
      }
    }
  },
  async mounted() {
    this.dashboardStore = useDashboardStore()
    this.syncWithStore()
    this.loadFilterOptions()
    
    // Инициализируем информацию о периоде
    await this.updatePeriodInfo()
    
    // Следим за изменениями фильтров в store
    this.$watch(
      () => this.dashboardStore.filters,
      (newFilters) => {
        this.localFilters = { ...newFilters }
        this.updatePeriodInfo()
      },
      { deep: true }
    )
  }
}
</script>

<style scoped>
@import '@/styles/filter_panel.css';

.period-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #495057;
  border-left: 4px solid #007bff;
}
</style>