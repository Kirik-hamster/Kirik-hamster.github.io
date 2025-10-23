import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Импортируем модули
import {
    fetchComparisonData
} from '@/stores/dashboard/apiService'

import {
    groupByArticles,
    groupByRegions,
    createComparisonData,
    createRegionsComparisonData,
    getChartDataByDate as processChartData,
    getRegionsChartData as processRegionsChartData,
    filterOrders,
    getFilterOptions as getFilterOptionsFromOrders
} from '@/stores/dashboard/dataProcessors'

import { createCache } from '@/stores/dashboard/cache'

export const useDashboardStore = defineStore('dashboard', () => {
    // Состояние
    const currentWeekOrders = ref([])
    const previousWeekOrders = ref([])
    const loading = ref(false)

    // Фильтры - добавляем period вместо dateFrom/dateTo
    const filters = ref({
        nm_id: '',
        region: '',
        category: '',
        brand: '',
        period: 7 // По умолчанию 7 дней
    })

    // Кэш
    const { cache, isCacheValid, updateCache, clearCache: clearCacheFn, getCachedData } = createCache()

    // Computed свойства для отфильтрованных данных
    const filteredCurrentWeekOrders = computed(() => {
        const { period, ...otherFilters } = filters.value
        return filterOrders(currentWeekOrders.value, otherFilters)
    })

    const filteredPreviousWeekOrders = computed(() => {
        const { period, ...otherFilters } = filters.value
        return filterOrders(previousWeekOrders.value, otherFilters)
    })

    // Действия
    const setLoading = (isLoading) => {
        loading.value = isLoading
    }

    // Основная функция получения данных сравнения
    const getComparisonData = async (forceRefresh = false) => {
        // Проверяем кэш
        if (!forceRefresh && isCacheValid()) {
            console.log('Используем кэшированные данные')
            return cache.value.comparisonData
        }
        
        console.log('Загружаем свежие данные с API')

        setLoading(true)
        try {
            // Используем новую функцию с периодом из фильтров
            const comparisonResult = await fetchComparisonData(filters.value.period)

            const { currentPeriod, previousPeriod, periodInfo } = comparisonResult

            // Сохраняем в state для обратной совместимости
            currentWeekOrders.value = currentPeriod
            previousWeekOrders.value = previousPeriod

            // Применяем фильтры (кроме периода)
            const { period, ...otherFilters } = filters.value
            
            const filteredCurrent = filterOrders(currentPeriod, otherFilters)
            const filteredPrevious = filterOrders(previousPeriod, otherFilters)

            console.log(`После фильтрации: ${filteredCurrent.length} текущих, ${filteredPrevious.length} предыдущих записей`)

            // Обрабатываем данные С УЧЕТОМ ФИЛЬТРОВ
            const currentGrouped = groupByArticles(filteredCurrent)
            const previousGrouped = groupByArticles(filteredPrevious)
            const currentRegionsGrouped = groupByRegions(filteredCurrent)
            const previousRegionsGrouped = groupByRegions(filteredPrevious)
            
            const comparisonData = {
                articles: createComparisonData(currentGrouped, previousGrouped),
                regions: createRegionsComparisonData(currentRegionsGrouped, previousRegionsGrouped),
                periodInfo // Добавляем информацию о периоде
            }

            const chartData = processChartData(filteredCurrent, filteredPrevious)
            const regionsChartData = processRegionsChartData(filteredCurrent, filteredPrevious)
            
            // Сохраняем в кэш
            updateCache({
                comparisonData,
                chartData,
                regionsChartData,
                rawData: {
                    current: filteredCurrent,
                    previous: filteredPrevious
                }
            })

            console.log('Данные загружены и закэшированы')
            return comparisonData
        } catch (error) {
            console.error('Ошибка загрузки данных:', error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Вспомогательные геттеры (оставляем для обратной совместимости с HomePage.vue)
    const getChartDataByDate = () => {
        return getCachedData('chartData') || processChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
    }

    const getRegionsChartData = () => {
        return getCachedData('regionsChartData') || processRegionsChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
    }

    // Методы для работы с фильтрами
    const setFilter = (filterType, value) => {
        // Преобразуем period в число
        if (filterType === 'period') {
            value = parseInt(value)
        }
        filters.value[filterType] = value
        // При изменении фильтров очищаем кэш, чтобы пересчитать данные
        clearCacheFn()
    }

    const clearFilters = () => {
        filters.value = {
            nm_id: '',
            region: '',
            category: '',
            brand: '',
            period: 7
        }
        // При очистке фильтров очищаем кэш
        clearCacheFn()
    }

    // Получить опции для фильтров
    const getFilterOptions = () => {
        const allOrders = [...currentWeekOrders.value, ...previousWeekOrders.value]
        return getFilterOptionsFromOrders(allOrders)
    }

    // Методы для обратной совместимости (если где-то используются)
    const fetchCurrentWeekData = async () => {
        // Для обратной совместимости - просто вызываем getComparisonData
        await getComparisonData(true)
    }

    const fetchPreviousWeekData = async () => {
        // Для обратной совместимости - уже загружается в getComparisonData
        console.log('fetchPreviousWeekData deprecated - use getComparisonData instead')
    }

    return {
        // Состояние
        currentWeekOrders,
        previousWeekOrders,
        loading,
        filters,
        
        // Computed свойства
        filteredCurrentWeekOrders,
        filteredPreviousWeekOrders,
        
        // Действия
        fetchCurrentWeekData,
        fetchPreviousWeekData,
        getComparisonData,
        
        // Геттеры
        getChartDataByDate,
        getRegionsChartData,
        
        // Фильтры
        setFilter,
        clearFilters,
        getFilterOptions,
        
        // Кэш
        clearCache: clearCacheFn,
        dataCache: cache
    }
})