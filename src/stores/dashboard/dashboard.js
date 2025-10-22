import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Импортируем модули
import {
    fetchCurrentWeekData as apiFetchCurrentWeekData,
    fetchPreviousWeekData as apiFetchPreviousWeekData
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

    // Фильтры
    const filters = ref({
        nm_id: '',
        region: '',
        dateFrom: '',
        dateTo: '',
        category: '',
        brand: ''
    })

    // Кэш
    const { cache, isCacheValid, updateCache, clearCache: clearCacheFn, getCachedData } = createCache()

    // Computed свойства для отфильтрованных данных
    const filteredCurrentWeekOrders = computed(() => {
        return filterOrders(currentWeekOrders.value, filters.value)
    })

    const filteredPreviousWeekOrders = computed(() => {
        return filterOrders(previousWeekOrders.value, filters.value)
    })

    // Действия
    const setLoading = (isLoading) => {
        loading.value = isLoading
    }

    // Загрузка данных текущей недели
    const fetchCurrentWeekData = async () => {
        setLoading(true)
        try {
            currentWeekOrders.value = await apiFetchCurrentWeekData()
        } catch (error) {
            console.error('Ошибка загрузки текущей недели:', error)
            currentWeekOrders.value = []
        } finally {
            setLoading(false)
        }
    }

    // Загрузка данных прошлой недели
    const fetchPreviousWeekData = async () => {
        setLoading(true)
        try {
            previousWeekOrders.value = await apiFetchPreviousWeekData()
        } catch (error) {
            console.error('Ошибка загрузки прошлой недели:', error)
            previousWeekOrders.value = []
        } finally {
            setLoading(false)
        }
    }

    // Основная функция получения данных сравнения
    const getComparisonData = async (forceRefresh = false) => {
        // Проверяем кэш
        if (!forceRefresh && isCacheValid()) {
            console.log('Используем кэшированные данные')
            return cache.value.comparisonData
        }
        
        console.log('Загружаем свежие данные с API')

        // Загружаем обе недели
        await Promise.all([fetchCurrentWeekData(), fetchPreviousWeekData()])
        
        // Обрабатываем данные С УЧЕТОМ ФИЛЬТРОВ
        const currentGrouped = groupByArticles(filteredCurrentWeekOrders.value)
        const previousGrouped = groupByArticles(filteredPreviousWeekOrders.value)
        const currentRegionsGrouped = groupByRegions(filteredCurrentWeekOrders.value)
        const previousRegionsGrouped = groupByRegions(filteredPreviousWeekOrders.value)
        
        const comparisonData = {
            articles: createComparisonData(currentGrouped, previousGrouped),
            regions: createRegionsComparisonData(currentRegionsGrouped, previousRegionsGrouped)
        }

        const chartData = processChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
        const regionsChartData = processRegionsChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
        
        // Сохраняем в кэш
        updateCache({
            comparisonData,
            chartData,
            regionsChartData
        })

        console.log('Данные загружены и закэшированы')
        return comparisonData
    }

    // Вспомогательные геттеры
    const getChartDataByDate = () => {
        return getCachedData('chartData') || processChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
    }

    const getRegionsChartData = () => {
        return getCachedData('regionsChartData') || processRegionsChartData(filteredCurrentWeekOrders.value, filteredPreviousWeekOrders.value)
    }

    // Методы для работы с фильтрами
    const setFilter = (filterType, value) => {
        filters.value[filterType] = value
        // При изменении фильтров очищаем кэш, чтобы пересчитать данные
        clearCacheFn()
    }

    const clearFilters = () => {
        filters.value = {
            nm_id: '',
            region: '',
            dateFrom: '',
            dateTo: '',
            category: '',
            brand: ''
        }
        // При очистке фильтров очищаем кэш
        clearCacheFn()
    }

    // Получить опции для фильтров
    const getFilterOptions = () => {
        const allOrders = [...currentWeekOrders.value, ...previousWeekOrders.value]
        return getFilterOptionsFromOrders(allOrders)
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