import { ref } from 'vue'

// Конфигурация кэша
export const createCache = (initialState = {}) => {
    const cache = ref({
        comparisonData: null,
        chartData: null,
        regionsChartData: null,
        lastFetchTime: null,
        cacheDuration: 10 * 60 * 1000, // 10 минут
        ...initialState
    })

    // Проверить, действителен ли кэш
    const isCacheValid = () => {
        const now = Date.now()
        return cache.value.comparisonData && 
               cache.value.lastFetchTime && 
               (now - cache.value.lastFetchTime) < cache.value.cacheDuration
    }

    // Обновить кэш
    const updateCache = (newData) => {
        cache.value = {
            ...cache.value,
            ...newData,
            lastFetchTime: Date.now()
        }
    }

    // Очистить кэш
    const clearCache = () => {
        cache.value = {
            comparisonData: null,
            chartData: null,
            regionsChartData: null,
            lastFetchTime: null,
            cacheDuration: cache.value.cacheDuration
        }
    }

    // Получить кэшированные данные
    const getCachedData = (key, fallbackValue = null) => {
        return cache.value[key] || fallbackValue
    }

    return {
        cache,
        isCacheValid,
        updateCache,
        clearCache,
        getCachedData
    }
}