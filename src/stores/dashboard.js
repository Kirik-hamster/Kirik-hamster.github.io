import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useDashboardStore = defineStore('dashboard', () => {
    const page = ref(1)
    const limit = ref(500)

    // Реактивные данные для текущей и прошлой недели
    const currentWeekOrders = ref([])
    const previousWeekOrders = ref([])
    const loading = ref(false)

    // Кэш для данных
    const dataCache = ref({
        comparisonData: null,
        chartData: null,
        regionsChartData: null,
        lastFetchTime: null,
        cacheDuration: 10 * 60 * 1000 // 10 минут кэша
    })

    // Функция для получения даты в формате YYYY-MM-DD
    const formatDate = (date) => {
        return date.toISOString().split('T')[0]
    }

    // Функция для загрузки данных за ОДИН день (аналогично fetchOrders из orders.js)
    const fetchDayData = async (datePrewStr, dateStr) => {
        try {
            loading.value = true
            const secretKey = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'
            
            const response = await axios.get('/api/api', {
                params: {
                    path: 'orders',
                    key: secretKey,
                    page: page.value, // Всегда первая страница
                    limit: limit.value, // Максимум 500 записей
                    dateFrom: datePrewStr, // Запрашиваем только один день
                    dateTo: dateStr    // Тот же самый день
                }
            })
            return response.data.data
            
        } catch (error) {
            console.error(`Ошибка загрузки данных за ${dateStr}:`, error)
            return []
        } finally {
            loading.value = false
        }
    }

    // Общий метод для загрузки данных за период
    const fetchWeekData = async (startOffset, daysCount) => {
        const orders = []
        
        try {
            const date = new Date()
            const datePrew = new Date()
            date.setDate(date.getDate() - (startOffset))
            datePrew.setDate(date.getDate() - (startOffset + daysCount))
            const dateStr = formatDate(date)
            const datePrewStr = formatDate(datePrew)

            const dayOrders = await fetchDayData(datePrewStr, dateStr)
            orders.push(...dayOrders)
          
        } catch (error) {
            console.error(`Ошибка загрузки данных за период (offset: ${startOffset}, days: ${daysCount}):`, error)
            throw error // Пробрасываем ошибку для обработки в вызывающих функциях
        }
        
        return orders
    }

    // Получить все данные текущей недели (7 дней в один массив)
    const fetchCurrentWeekData = async () => {
        loading.value = true
        currentWeekOrders.value = []

        try {
            // Загружаем последние 7 дней 
            currentWeekOrders.value = await fetchWeekData(0, 7)
        } catch (error) {
            console.error('Ошибка загрузки текущей недели:', error)
        } finally {
            loading.value = false
        }
    }

    // Получить все данные прошлой недели (7 дней в один массив)
    const fetchPreviousWeekData = async () => {
        loading.value = true
        previousWeekOrders.value = []

        try {
            // Загружаем дни с 8 по 14 дней назад
            previousWeekOrders.value = await fetchWeekData(8, 7)
        } catch (error) {
            console.error('Ошибка загрузки прошлой недели:', error)
        } finally {
            loading.value = false
        }
    }

    // Функция для группировки заказов по артикулам
    const groupByArticles = (orders) => {
        const grouped = {}
        
        orders.forEach(order => {
            if (!grouped[order.nm_id]) {
                grouped[order.nm_id] = {
                    nm_id: order.nm_id,
                    sales: 0,           // Количество продаж (не отмененные)
                    revenue: 0,          // Сумма выручки
                    cancellations: 0,    // Количество отмен
                    discountSum: 0,      // Сумма скидок для расчета средней
                    discountCount: 0,    // Количество заказов со скидкой
                    ordersCount: 0       // Общее количество заказов
                }
            }
            
            const article = grouped[order.nm_id]
            
            if (!order.is_cancel) {
                // Не отмененный заказ - считаем как продажу
                article.sales++
                article.revenue += parseFloat(order.total_price) || 0
                article.discountSum += order.discount_percent || 0
                article.discountCount++
            } else {
                // Отмененный заказ
                article.cancellations++
            }
            
            article.ordersCount++
        })
        
        // Вычисляем среднюю скидку для каждого артикула
        Object.values(grouped).forEach(article => {
            article.avgDiscount = article.discountCount > 0 
                ? article.discountSum / article.discountCount 
                : 0
        })
        
        return grouped
    }

    // Функция для создания массива сравнения
    const createComparisonData = (currentWeekGrouped, previousWeekGrouped) => {
        const comparison = []
        
        // Проходим по всем артикулам текущей недели
        Object.keys(currentWeekGrouped).forEach(nm_id => {
            const current = currentWeekGrouped[nm_id]
            const previous = previousWeekGrouped[nm_id] || {
                sales: 0,
                revenue: 0,
                cancellations: 0,
                avgDiscount: 0
            }
            
            // Функция для расчета процентного изменения
            const calculateChange = (currentVal, previousVal) => {
                if (previousVal === 0) return currentVal > 0 ? 100 : 0
                return ((currentVal - previousVal) / previousVal) * 100
            }
            
            comparison.push({
                nm_id: nm_id,
                // Текущая неделя
                current_sales: current.sales,
                current_revenue: current.revenue,
                current_cancellations: current.cancellations,
                current_discount: current.avgDiscount,
                // Прошлая неделя
                previous_sales: previous.sales,
                previous_revenue: previous.revenue,
                previous_cancellations: previous.cancellations,
                previous_discount: previous.avgDiscount,
                // Изменения в %
                sales_change: calculateChange(current.sales, previous.sales),
                revenue_change: calculateChange(current.revenue, previous.revenue),
                cancellations_change: calculateChange(current.cancellations, previous.cancellations),
                discount_change: calculateChange(current.avgDiscount, previous.avgDiscount)
            })
        })
        
        return comparison
    }

    // НОВАЯ ФУНКЦИЯ: Агрегация данных по датам для графиков
    const getChartDataByDate = () => {
    // Объединяем данные за обе недели
    const allOrders = [...currentWeekOrders.value, ...previousWeekOrders.value]
    
    // Группируем заказы по датам
    const ordersByDate = {}
    
    allOrders.forEach(order => {
        const orderDate = new Date(order.date)
        const dateKey = orderDate.toISOString().split('T')[0]
        
        if (!ordersByDate[dateKey]) {
            ordersByDate[dateKey] = []
        }
        ordersByDate[dateKey].push(order)
    })
    
    // Получаем массив дат за последние 14 дней
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last14Days.push(formatDate(date))
    }
    
    // Агрегируем данные для каждой даты
    const revenueByDay = []
    const salesByDay = []
    const cancellationsByDay = []
    const discountByDay = []
    
    last14Days.forEach(date => {
        const dayOrders = ordersByDate[date] || []
        
        // Выручка за день (только не отмененные)
        const dayRevenue = dayOrders
            .filter(order => !order.is_cancel)
            .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0)
        
        // Продажи за день (количество не отмененных)
        const daySales = dayOrders.filter(order => !order.is_cancel).length
        
        // Отмены за день
        const dayCancellations = dayOrders.filter(order => order.is_cancel).length
        
        // Средняя скидка за день (только не отмененные)
        const validDiscountOrders = dayOrders.filter(order => !order.is_cancel && order.discount_percent)
        const dayDiscount = validDiscountOrders.length > 0 
            ? validDiscountOrders.reduce((sum, order) => sum + (order.discount_percent || 0), 0) / validDiscountOrders.length
            : 0
        
        revenueByDay.push(dayRevenue)
        salesByDay.push(daySales)
        cancellationsByDay.push(dayCancellations)
        discountByDay.push(dayDiscount)
    })
    
    // Форматируем даты для labels
    const formattedLabels = last14Days.map(dateStr => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    })
        
        // Реверсируем массивы данных, чтобы шли от старых к новым датам
        return {
            labels: formattedLabels,
            revenue: revenueByDay.reverse(),
            sales: salesByDay.reverse(),
            cancellations: cancellationsByDay.reverse(),
            discount: discountByDay.reverse()
        }
    }

    // Функция для группировки заказов по регионам
    const groupByRegions = (orders) => {
        const grouped = {}
        
        orders.forEach(order => {
            const region = order.oblast
            if (!grouped[region]) {
                grouped[region] = {
                    region: region,
                    orders: 0,           // Общее количество заказов
                    sales: 0,            // Количество продаж (не отмененные)
                    revenue: 0,          // Сумма выручки
                    cancellations: 0,    // Количество отмен
                    discountSum: 0,      // Сумма скидок для расчета средней
                    discountCount: 0     // Количество заказов со скидкой
                }
            }
            
            const regionData = grouped[region]
            
            if (!order.is_cancel) {
                // Не отмененный заказ - считаем как продажу
                regionData.sales++
                regionData.revenue += parseFloat(order.total_price) || 0
                regionData.discountSum += order.discount_percent || 0
                regionData.discountCount++
            } else {
                // Отмененный заказ
                regionData.cancellations++
            }
            
            regionData.orders++
        })
        
        // Вычисляем среднюю скидку для каждого региона
        Object.values(grouped).forEach(region => {
            region.avgDiscount = region.discountCount > 0 
                ? region.discountSum / region.discountCount 
                : 0
        })
        
        return grouped
    }

    // Функция для создания массива сравнения по регионам
    const createRegionsComparisonData = (currentWeekGrouped, previousWeekGrouped) => {
        const comparison = []
        
        // Собираем все уникальные регионы из обеих недель
        const allRegions = new Set([
            ...Object.keys(currentWeekGrouped),
            ...Object.keys(previousWeekGrouped)
        ])
        
        allRegions.forEach(regionName => {
            const current = currentWeekGrouped[regionName] || {
                orders: 0,
                sales: 0,
                revenue: 0,
                cancellations: 0,
                avgDiscount: 0
            }
            
            const previous = previousWeekGrouped[regionName] || {
                orders: 0,
                sales: 0,
                revenue: 0,
                cancellations: 0,
                avgDiscount: 0
            }
            
            // Функция для расчета процентного изменения
            const calculateChange = (currentVal, previousVal) => {
                if (previousVal === 0) return currentVal > 0 ? 100 : 0
                return ((currentVal - previousVal) / previousVal) * 100
            }
            
            comparison.push({
                region: regionName,
                // Текущая неделя
                current_orders: current.orders,
                current_sales: current.sales,
                current_revenue: current.revenue,
                current_cancellations: current.cancellations,
                current_discount: current.avgDiscount,
                // Прошлая неделя
                previous_orders: previous.orders,
                previous_sales: previous.sales,
                previous_revenue: previous.revenue,
                previous_cancellations: previous.cancellations,
                previous_discount: previous.avgDiscount,
                // Изменения в %
                orders_change: calculateChange(current.orders, previous.orders),
                sales_change: calculateChange(current.sales, previous.sales),
                revenue_change: calculateChange(current.revenue, previous.revenue),
                cancellations_change: calculateChange(current.cancellations, previous.cancellations),
                discount_change: calculateChange(current.avgDiscount, previous.avgDiscount)
            })
        })
        
        return comparison
    }

    // Функция для получения данных по регионам для графика
    const getRegionsChartData = () => {
    const currentRegionsGrouped = groupByRegions(currentWeekOrders.value)
    const previousRegionsGrouped = groupByRegions(previousWeekOrders.value)
    
    // Объединяем регионы из обеих недель
    const allRegions = new Set([
        ...Object.keys(currentRegionsGrouped),
        ...Object.keys(previousRegionsGrouped)
    ])
    
    // Создаем данные для сравнения
    const regionsData = Array.from(allRegions).map(regionName => {
        const current = currentRegionsGrouped[regionName] || { orders: 0 }
        const previous = previousRegionsGrouped[regionName] || { orders: 0 }
        
        return {
            region: regionName,
            current_orders: current.orders,
            previous_orders: previous.orders
        }
    })
    
    // Сортируем по общему количеству заказов и берем топ-5
    const topRegions = regionsData
        .sort((a, b) => (b.current_orders + b.previous_orders) - (a.current_orders + a.previous_orders))
        .slice(0, 5)
    
    return {
        labels: topRegions.map(region => {
            const regionName = region.region
            if (regionName.includes('область')) {
                return regionName.replace(' область', '')
            }
            if (regionName.includes('край')) {
                return regionName.replace(' край', '')
            }
            return regionName
        }),
        datasets: [
            {
                label: 'Текущая неделя',
                data: topRegions.map(region => region.current_orders),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            },
            {
                label: 'Предыдущая неделя',
                data: topRegions.map(region => region.previous_orders),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
            }
        ]
    }
    }

    // Главная функция для получения всех данных сравнения c кэшированием
    const getComparisonData = async (forceRefresh = false) => {
        // Проверяем кэш
        const now = Date.now()
        if (!forceRefresh && 
            dataCache.value.comparisonData && 
            dataCache.value.lastFetchTime && 
            (now - dataCache.value.lastFetchTime) < dataCache.value.cacheDuration) {
            console.log('Используем кэшированные данные')
            return dataCache.value.comparisonData
        }
        
        console.log('Загружаем свежие данные с API')

        // Загружаем обе недели
        await fetchCurrentWeekData()
        await fetchPreviousWeekData()
        
        // Группируем данные
        const currentGrouped = groupByArticles(currentWeekOrders.value)
        const previousGrouped = groupByArticles(previousWeekOrders.value)
        
        // Группируем данные по регионам
        const currentRegionsGrouped = groupByRegions(currentWeekOrders.value)
        const previousRegionsGrouped = groupByRegions(previousWeekOrders.value)
        
        // Создаем данные для сравнения
        const comparisonData = createComparisonData(currentGrouped, previousGrouped)
        const regionsComparisonData = createRegionsComparisonData(currentRegionsGrouped, previousRegionsGrouped)
        
        // Сохраняем в кэш
        dataCache.value = {
            comparisonData: {
                articles: comparisonData,
                regions: regionsComparisonData
            },
            chartData: getChartDataByDate(),
            regionsChartData: getRegionsChartData(),
            lastFetchTime: now,
            cacheDuration: dataCache.value.cacheDuration
        }
        
        console.log('Данные загружены и закэшированы')
        return dataCache.value.comparisonData
    }

    // Функции для получения кэшированных данных
    const getCachedChartData = () => {
        return dataCache.value.chartData || getChartDataByDate()
    }

    const getCachedRegionsChartData = () => {
        return dataCache.value.regionsChartData || getRegionsChartData()
    }

    // Функция для очистки кэша (принудительное обновление)
    const clearCache = () => {
        dataCache.value = {
            comparisonData: null,
            chartData: null,
            regionsChartData: null,
            lastFetchTime: null,
            cacheDuration: dataCache.value.cacheDuration
        }
    }
    return {
        currentWeekOrders,
        previousWeekOrders,
        loading,
        fetchCurrentWeekData,
        fetchPreviousWeekData,
        getComparisonData,
        getChartDataByDate: getCachedChartData,
        getRegionsChartData: getCachedRegionsChartData,
        clearCache,
        dataCache
    }
})