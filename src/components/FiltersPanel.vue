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

      <!-- Фильтр по дате от -->
      <div class="filter-group">
        <label for="dateFrom">Дата с</label>
        <input
          id="dateFrom"
          v-model="localFilters.dateFrom"
          type="date"
          @change="updateFilter('dateFrom', $event.target.value)"
        />
      </div>

      <!-- Фильтр по дате до -->
      <div class="filter-group">
        <label for="dateTo">Дата по</label>
        <input
          id="dateTo"
          v-model="localFilters.dateTo"
          type="date"
          @change="updateFilter('dateTo', $event.target.value)"
        />
      </div>
    </div>

    <!-- Индикатор активных фильтров -->
    <div v-if="activeFiltersCount > 0" class="active-filters">
      <span class="active-filters-count">
        Активных фильтров: {{ activeFiltersCount }}
      </span>
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
        dateFrom: '',
        dateTo: ''
      },
      filterOptions: {
        regions: [],
        categories: [],
        brands: []
      },
      dashboardStore: null
    }
  },
  computed: {
    activeFiltersCount() {
      return Object.values(this.localFilters).filter(value => value !== '').length
    }
  },
  methods: {
    updateFilter(type, value) {
      if (this.dashboardStore) {
        this.dashboardStore.setFilter(type, value)
      }
    },
    clearFilters() {
      this.localFilters = {
        nm_id: '',
        region: '',
        category: '',
        brand: '',
        dateFrom: '',
        dateTo: ''
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
    }
  },
  mounted() {
    this.dashboardStore = useDashboardStore()
    this.syncWithStore()
    this.loadFilterOptions()
    
    // Следим за изменениями фильтров в store
    this.$watch(
      () => this.dashboardStore.filters,
      (newFilters) => {
        this.localFilters = { ...newFilters }
      },
      { deep: true }
    )
  }
}
</script>

<style scoped>
@import '@/styles/filter_panel.css';
</style>