<template>
  <div class="table-section">
    <div class="table-header">
      <h3>Все {{ isRegions ? 'регионы' : 'артикулы' }}</h3>
      <div class="table-info">
        <span class="total-items">Всего записей: {{ totalItems }}</span>
        <div class="sort-info" v-if="sortConfig.field">
          <span class="sort-label">Сортировка:</span>
          <span class="sort-value">{{ currentSortText }}</span>
          <button @click="clearSort" class="clear-sort-btn">×</button>
        </div>
        <div class="items-per-page">
          <label for="itemsPerPage">Элементов на странице:</label>
          <select 
            id="itemsPerPage" 
            v-model="itemsPerPage" 
            @change="changeItemsPerPage"
            class="page-select"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="table-container">
      <table class="articles-table">
        <thead>
          <tr>
            <th 
              v-for="header in tableHeaders" 
              :key="header.key"
              :class="{ 'sortable': header.sortable }"
              class="sort-header"
            >
              <div class="header-content">
                {{ header.label }}
                <div class="sort-controls" v-if="header.sortable">
                  <button 
                    class="sort-btn"
                    @click.stop="toggleSortMenu(header.key)"
                    :class="{ active: activeSortMenu === header.key }"
                  >
                    <span class="sort-icon">↕</span>
                  </button>
                  <div 
                    class="sort-menu" 
                    v-if="activeSortMenu === header.key"
                    @click.stop
                  >
                    <button 
                      class="sort-option"
                      @click="applySort(header.key, 'asc')"
                      :class="{ active: sortConfig.field === header.key && sortConfig.direction === 'asc' }"
                    >
                      ↑ По возрастанию
                    </button>
                    <button 
                      class="sort-option"
                      @click="applySort(header.key, 'desc')"
                      :class="{ active: sortConfig.field === header.key && sortConfig.direction === 'desc' }"
                    >
                      ↓ По убыванию
                    </button>
                    <button 
                      class="sort-option clear" 
                      v-if="sortConfig.field === header.key"
                      @click="clearSort"
                    >
                      ✕ Отменить сортировку
                    </button>
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in paginatedItems" 
            :key="getItemId(item)"
            :class="{ 'clickable-row': !isRegions }"
            @click="handleRowClick(item)"
          >
            <td>{{ getItemId(item) }}</td>
            <td>{{ formatValue(getCurrentValue(item)) }}</td>
            <td>{{ formatValue(getPreviousValue(item)) }}</td>
            <td :class="getChangeClass(getChangeValue(item))">
              {{ Math.round(getChangeValue(item) * 10) / 10 }}% 
              <span v-if="getChangeValue(item) > 0">↑</span>
              <span v-else-if="getChangeValue(item) < 0">↓</span>
            </td>
          </tr>
          <tr v-if="paginatedItems.length === 0">
            <td :colspan="tableHeaders.length" class="no-data">
              Нет данных для отображения
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Пагинация -->
    <MetricPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @page-change="goToPage"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { formatValue, getChangeClass } from '@/utils/metricConfig'
import MetricPagination from './MetricPagination.vue'

export default {
  name: 'MetricTable',
  components: {
    MetricPagination
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    tableHeaders: {
      type: Array,
      required: true
    },
    valueFields: {
      type: Object,
      required: true
    },
    isRegions: {
      type: Boolean,
      default: false
    },
    getItemId: {
      type: Function,
      required: true
    }
  },
  emits: ['rowClick'],
  setup(props, { emit }) {
    // Данные для пагинации
    const currentPage = ref(1)
    const itemsPerPage = ref(25)
    const totalPages = ref(1)

    // Данные для сортировки
    const sortConfig = ref({
      field: null,
      direction: null
    })
    const activeSortMenu = ref(null)

    // Вычисляемые свойства
    const totalItems = computed(() => props.items.length)

    const sortedItems = computed(() => {
      if (!sortConfig.value.field || !sortConfig.value.direction) {
        return props.items
      }
      
      return [...props.items].sort((a, b) => {
        let aValue = a[sortConfig.value.field]
        let bValue = b[sortConfig.value.field]
        
        if (sortConfig.value.field.includes('_change')) {
          aValue = parseFloat(aValue) || 0
          bValue = parseFloat(bValue) || 0
        }
        
        if (sortConfig.value.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    })

    const paginatedItems = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage.value
      const endIndex = startIndex + itemsPerPage.value
      return sortedItems.value.slice(startIndex, endIndex)
    })

    const currentSortText = computed(() => {
      if (!sortConfig.value.field) return 'Без сортировки'
      
      const fieldNames = {
        'current_revenue': 'текущая выручка',
        'previous_revenue': 'предыдущая выручка', 
        'revenue_change': 'изменение выручки',
        'current_discount': 'текущая скидка',
        'previous_discount': 'предыдущая скидка',
        'discount_change': 'изменение скидки',
        'current_cancellations': 'текущие отмены',
        'previous_cancellations': 'предыдущие отмены',
        'cancellations_change': 'изменение отмен',
        'current_orders': 'текущие заказы',
        'previous_orders': 'предыдущие заказы',
        'orders_change': 'изменение заказов'
      }
      
      const directionText = sortConfig.value.direction === 'asc' ? 'по возрастанию' : 'по убыванию'
      return `${fieldNames[sortConfig.value.field]} ${directionText}`
    })

    // Методы
    const getCurrentValue = (item) => item[props.valueFields.current] || 0
    const getPreviousValue = (item) => item[props.valueFields.previous] || 0
    const getChangeValue = (item) => item[props.valueFields.change] || 0

    const handleRowClick = (item) => {
      if (!props.isRegions) {
        emit('rowClick', item)
      }
    }

    const changeItemsPerPage = (event) => {
      itemsPerPage.value = parseInt(event.target.value)
      updatePagination()
      currentPage.value = 1
    }

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    const toggleSortMenu = (field) => {
      activeSortMenu.value = activeSortMenu.value === field ? null : field
    }

    const applySort = (field, direction) => {
      sortConfig.value = { field, direction }
      activeSortMenu.value = null
      currentPage.value = 1
    }

    const clearSort = () => {
      sortConfig.value = { field: null, direction: null }
      activeSortMenu.value = null
    }

    const closeSortMenu = (event) => {
      if (!event.target.closest('.sort-header')) {
        activeSortMenu.value = null
      }
    }

    const updatePagination = () => {
      totalPages.value = Math.ceil(props.items.length / itemsPerPage.value)
      if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value)
      }
    }

    // Хуки жизненного цикла
    onMounted(() => {
      document.addEventListener('click', closeSortMenu)
      updatePagination()
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeSortMenu)
    })

    // Следим за изменениями items
    watch(() => props.items, updatePagination)

    return {
      // Data
      currentPage,
      itemsPerPage,
      totalPages,
      sortConfig,
      activeSortMenu,
      
      // Computed
      totalItems,
      paginatedItems,
      currentSortText,
      
      // Methods
      getCurrentValue,
      getPreviousValue,
      getChangeValue,
      handleRowClick,
      changeItemsPerPage,
      goToPage,
      toggleSortMenu,
      applySort,
      clearSort,
      formatValue,
      getChangeClass
    }
  }
}
</script>

<style scoped>
@import '@/styles/metric/metric_table.css';
</style>