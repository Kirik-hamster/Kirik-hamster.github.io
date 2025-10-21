import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useOrdersStore = defineStore('orders', () => {
  const allOrders = ref([])
  const filteredOrders = ref([])
  const loading = ref(false)
  const error = ref(null)
  const page = ref(1)
  const limit = ref(500)
  const totalPages = ref(1)
  
  // Добавляем состояние для сортировки
  const sortField = ref(null)
  const sortOrder = ref('asc') // 'asc' или 'desc'
  const sortMenuOpen = ref(null) // Для отслеживания открытого меню

  // Функция для форматирования даты в YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  // Изначальные фильтры (последние 7 дней)
  const filters = ref({
    dateFrom: formatDate(new Date(new Date().setDate(new Date().getDate() - 7))),
    dateTo: formatDate(new Date()),
    limit: limit.value,
    region: '',
    barcode: ''
  })

  // Опции для лимита
  const limitOptions = ref([10, 25, 50, 100, 250, 500])

  // Computed свойство для отображаемых заказов с пагинацией
  const orders = computed(() => {
    // Создаем копию отфильтрованных данных для сортировки
    let sortedData = [...filteredOrders.value]
  
    // Применяем сортировку если она активна
    if (sortField.value) {
      sortedData.sort((a, b) => {
        // Приводим значения к числам, если это числовые поля
        let valueA = a[sortField.value]
        let valueB = b[sortField.value]
        
        if (sortField.value === 'discount_percent' || sortField.value === 'total_price') {
          valueA = parseFloat(valueA) || 0
          valueB = parseFloat(valueB) || 0
        }
        
        if (sortOrder.value === 'asc') {
          return valueA > valueB ? 1 : -1
        } else {
          return valueA < valueB ? 1 : -1
        }
      })
    }
    const start = (page.value - 1) * filters.value.limit
    const end = start + filters.value.limit
    return sortedData.slice(start, end)
  })

  // Computed свойство для общего количества отфильтрованных заказов
  const totalFilteredOrders = computed(() => {
    return filteredOrders.value.length
  })

  async function fetchOrders() {
    try {
      loading.value = true
      error.value = null

      const sicretKey = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
      
      const response = await axios.get('/api/api', {
        params: {
          path: 'orders',
          key: sicretKey,
          page: page.value,
          limit: filters.value.limit,
          dateFrom: filters.value.dateFrom, 
          dateTo: filters.value.dateTo   
        }
      })
      console.log(filters.value.dateFrom, filters.value.dateTo )
      console.log("orders: ", response.data.data)
      allOrders.value = response.data.data
      totalPages.value = Math.ceil(response.data.meta.total / limit.value)
      applyFilters()
    } catch (err) {
      error.value = `Ошибка ${err.response?.status || 400}: ${err.response?.data?.message || 'Неверный запрос'}`
      console.error('Детали ошибки:', err.config)
    } finally {
      loading.value = false
    }
  }

  // Функция для сортировки текущей страницы
  function applySort(field, order) {
    sortField.value = field
    sortOrder.value = order
    sortMenuOpen.value = null
  }

  // Функция для открытия/закрытия меню сортировки
  function toggleSortMenu(field) {
    if (sortMenuOpen.value === field) {
      sortMenuOpen.value = null
    } else {
      sortMenuOpen.value = field
    }
  }

  // Функция для сброса сортировки
  function clearSort() {
    sortField.value = null
    sortOrder.value = null
    sortMenuOpen.value = null
    // Переприменяем фильтры чтобы обновить отображение (без перезагрузки)
    applyFilters()
  }

  // ДОБАВЛЕННЫЕ ФУНКЦИИ ДЛЯ ПАГИНАЦИИ
  function nextPage() {
    if (page.value < totalPages.value) {
      page.value++
    }
  }

  function prevPage() {
    if (page.value > 1) {
      page.value--
    }
  }

  // Функция применения фильтров
  function applyFilters(newFilters = {}) {
    if (newFilters) {
      filters.value = {
        ...filters.value,
        ...newFilters
      }
    }

    // Фильтрация данных
    filteredOrders.value = allOrders.value.filter(order => {
      // Фильтр по региону (частичное совпадение, без учета регистра)
      if (filters.value.region && 
          !order.oblast?.toLowerCase().includes(filters.value.region.toLowerCase())) {
        return false
      }

      // Фильтр по штрихкоду (точное совпадение)
      if (filters.value.barcode && order.barcode != filters.value.barcode) {
        return false
      }

      // Фильтр по дате (если API не фильтрует)
      const orderDate = new Date(order.date)
      const fromDate = new Date(filters.value.dateFrom)
      const toDate = new Date(filters.value.dateTo)
      
      if (orderDate < fromDate || orderDate > toDate) {
        return false
      }

      return true
    })

    // Пересчет пагинации
    page.value = 1
    totalPages.value = Math.ceil(filteredOrders.value.length / filters.value.limit)
  }

  // Функция для получения сброшенных фильтров (добавьте эту функцию)
  function getResetFilters() {
    const today = new Date()
    return {
      dateFrom: formatDate(new Date(today.setDate(today.getDate() - 7))),
      dateTo: formatDate(new Date()),
      limit: 500,
      region: '',
      barcode: ''
    }
  }

  // Функция сброса фильтров
  function resetFilters() {
    const resetFilters = getResetFilters()
    applyFilters(resetFilters)
    // Также сбрасываем сортировку при полном сбросе
    clearSort()
  }

  return {
    orders,
    loading,
    error,
    page,
    totalPages,
    filters,
    limitOptions,
    sortField,
    sortOrder,
    sortMenuOpen,
    totalFilteredOrders,
    fetchOrders, 
    nextPage,
    prevPage,
    applyFilters,
    resetFilters,
    applySort,
    toggleSortMenu,
    clearSort,
    getResetFilters
  }
})