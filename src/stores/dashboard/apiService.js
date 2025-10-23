import axios from 'axios'

const secretKey = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

// Функция для получения даты в формате YYYY-MM-DD
export const formatDate = (date) => {
    return date.toISOString().split('T')[0]
}

// Функция для загрузки данных за период
export const fetchDayData = async (dateFrom, dateTo, page = 1, limit = 500) => {
    try {
        const response = await axios.get('/api/api', {
            params: {
                path: 'orders',
                key: secretKey,
                page: page,
                limit: limit,
                dateFrom: dateFrom,
                dateTo: dateTo
            }
        })
        return response.data.data
    } catch (error) {
        console.error(`Ошибка загрузки данных за ${dateTo}:`, error)
        return []
    }
}

// Общий метод для загрузки данных за период
export const fetchWeekData = async (startOffset, daysCount) => {
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
        throw error
    }
    
    return orders
}

// Получить данные за выбранный период и предыдущий период той же длины
export const fetchComparisonData = async (days = 7) => {
    try {
        // Вычисляем даты для текущего периода
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - (days - 1))
        
        // Вычисляем даты для предыдущего периода
        const prevEndDate = new Date(startDate)
        prevEndDate.setDate(prevEndDate.getDate() - 1)
        const prevStartDate = new Date(prevEndDate)
        prevStartDate.setDate(prevStartDate.getDate() - (days - 1))
        
        // Форматируем даты
        const currentStartStr = formatDate(startDate)
        const currentEndStr = formatDate(endDate)
        const prevStartStr = formatDate(prevStartDate)
        const prevEndStr = formatDate(prevEndDate)
        
        console.log(`Сравнение периодов (${days} дней):`)
        console.log(`- Текущий: ${currentStartStr} - ${currentEndStr}`)
        console.log(`- Предыдущий: ${prevStartStr} - ${prevEndStr}`)

        // Загружаем данные за оба периода
        const [currentPeriodData, previousPeriodData] = await Promise.all([
            fetchDayData(currentStartStr, currentEndStr),
            fetchDayData(prevStartStr, prevEndStr)
        ])
        
        return {
            currentPeriod: currentPeriodData,
            previousPeriod: previousPeriodData,
            periodInfo: {
                currentStart: currentStartStr,
                currentEnd: currentEndStr,
                previousStart: prevStartStr,
                previousEnd: prevEndStr,
                daysCount: days
            }
        }
      
    } catch (error) {
        console.error('Ошибка загрузки данных сравнения:', error)
        throw error
    }
}

// Получить данные за последние N дней (для обратной совместимости)
export const fetchLastNDaysData = async (days = 7) => {
    return await fetchComparisonData(days)
}