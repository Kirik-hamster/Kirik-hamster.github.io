import axios from 'axios'

const secretKey = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

// Функция для получения даты в формате YYYY-MM-DD
export const formatDate = (date) => {
    return date.toISOString().split('T')[0]
}

// Функция для загрузки данных за ОДИН день
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

// Получить все данные текущей недели
export const fetchCurrentWeekData = async () => {
    return await fetchWeekData(0, 7)
}

// Получить все данные прошлой недели
export const fetchPreviousWeekData = async () => {
    return await fetchWeekData(8, 7)
}