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
            for (let i = 0; i < daysCount; i++) {
                const date = new Date()
                const datePrew = new Date()
                date.setDate(date.getDate() - (startOffset + i))
                datePrew.setDate(date.getDate() - 1)
                const dateStr = formatDate(date)
                const datePrewStr = formatDate(datePrew)

                const dayOrders = await fetchDayData(datePrewStr, dateStr)
                orders.push(...dayOrders)
            }
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
            // Загружаем последние 7 дней (от 0 до 6 дней назад)
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
            // Загружаем дни с 7 по 13 дней назад
            previousWeekOrders.value = await fetchWeekData(7, 7)
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
        // Группируем заказы по датам
        const ordersByDate = {}
        
        currentWeekOrders.value.forEach(order => {
            const orderDate = new Date(order.date)
            const dateKey = orderDate.toISOString().split('T')[0] // YYYY-MM-DD
            
            if (!ordersByDate[dateKey]) {
                ordersByDate[dateKey] = []
            }
            ordersByDate[dateKey].push(order)
        })
        
        // Получаем массив дат за последние 7 дней
        const last7Days = []
        for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            last7Days.push(formatDate(date))
        }
        
        // Агрегируем данные для каждой даты
        const revenueByDay = []
        const salesByDay = []
        const cancellationsByDay = []
        const discountByDay = []
        
        last7Days.forEach(date => {
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
        
        // Форматируем даты для labels (например: "21 окт")
        const formattedLabels = last7Days.map(dateStr => {
            const date = new Date(dateStr)
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
        }).reverse()
        
        // Реверсируем массивы данных, чтобы шли от старых к новым датам
        return {
            labels: formattedLabels,
            revenue: revenueByDay.reverse(),
            sales: salesByDay.reverse(),
            cancellations: cancellationsByDay.reverse(),
            discount: discountByDay.reverse()
        }
    }

    // Главная функция для получения всех данных сравнения
    const getComparisonData = async () => {
        // Загружаем обе недели
        await fetchCurrentWeekData()
        await fetchPreviousWeekData()
        
        // Группируем данные
        const currentGrouped = groupByArticles(currentWeekOrders.value)
        const previousGrouped = groupByArticles(previousWeekOrders.value)
        
        // Создаем данные для сравнения
        const comparisonData = createComparisonData(currentGrouped, previousGrouped)
        
        console.log('Данные для сравнения готовы:', comparisonData)
        return comparisonData
    }
    return {
        currentWeekOrders,
        previousWeekOrders,
        loading,
        fetchCurrentWeekData,
        fetchPreviousWeekData,
        getComparisonData,
        getChartDataByDate 
    }
})