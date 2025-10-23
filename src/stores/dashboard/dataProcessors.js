// Функция для группировки заказов по артикулам
export const groupByArticles = (orders) => {
    const grouped = {}
    
    orders.forEach(order => {
        if (!grouped[order.nm_id]) {
            grouped[order.nm_id] = {
                nm_id: order.nm_id,
                sales: 0,
                revenue: 0,
                cancellations: 0,
                discountSum: 0,
                discountCount: 0,
                ordersCount: 0
            }
        }
        
        const article = grouped[order.nm_id]
        
        if (!order.is_cancel) {
            article.sales++
            article.revenue += parseFloat(order.total_price) || 0
            article.discountSum += order.discount_percent || 0
            article.discountCount++
        } else {
            article.cancellations++
        }
        
        article.ordersCount++
    })
    
    // Вычисляем среднюю скидку
    Object.values(grouped).forEach(article => {
        article.avgDiscount = article.discountCount > 0 
            ? article.discountSum / article.discountCount 
            : 0
    })
    
    return grouped
}

// Функция для группировки заказов по регионам
export const groupByRegions = (orders) => {
    const grouped = {}
    
    orders.forEach(order => {
        const region = order.oblast
        if (!grouped[region]) {
            grouped[region] = {
                region: region,
                orders: 0,
                sales: 0,
                revenue: 0,
                cancellations: 0,
                discountSum: 0,
                discountCount: 0
            }
        }
        
        const regionData = grouped[region]
        
        if (!order.is_cancel) {
            regionData.sales++
            regionData.revenue += parseFloat(order.total_price) || 0
            regionData.discountSum += order.discount_percent || 0
            regionData.discountCount++
        } else {
            regionData.cancellations++
        }
        
        regionData.orders++
    })
    
    // Вычисляем среднюю скидку
    Object.values(grouped).forEach(region => {
        region.avgDiscount = region.discountCount > 0 
            ? region.discountSum / region.discountCount 
            : 0
    })
    
    return grouped
}

// Функция для расчета процентного изменения
const calculateChange = (currentVal, previousVal) => {
    if (previousVal === 0) return currentVal > 0 ? 100 : 0
    return ((currentVal - previousVal) / previousVal) * 100
}

// Функция для создания массива сравнения по артикулам
export const createComparisonData = (currentWeekGrouped, previousWeekGrouped) => {
    const comparison = []
    
    Object.keys(currentWeekGrouped).forEach(nm_id => {
        const current = currentWeekGrouped[nm_id]
        const previous = previousWeekGrouped[nm_id] || {
            sales: 0,
            revenue: 0,
            cancellations: 0,
            avgDiscount: 0
        }
        
        comparison.push({
            nm_id: nm_id,
            current_sales: current.sales,
            current_revenue: current.revenue,
            current_cancellations: current.cancellations,
            current_discount: current.avgDiscount,
            previous_sales: previous.sales,
            previous_revenue: previous.revenue,
            previous_cancellations: previous.cancellations,
            previous_discount: previous.avgDiscount,
            sales_change: calculateChange(current.sales, previous.sales),
            revenue_change: calculateChange(current.revenue, previous.revenue),
            cancellations_change: calculateChange(current.cancellations, previous.cancellations),
            discount_change: calculateChange(current.avgDiscount, previous.avgDiscount)
        })
    })
    
    return comparison
}

// Функция для создания массива сравнения по регионам
export const createRegionsComparisonData = (currentWeekGrouped, previousWeekGrouped) => {
    const comparison = []
    
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
        
        comparison.push({
            region: regionName,
            current_orders: current.orders,
            current_sales: current.sales,
            current_revenue: current.revenue,
            current_cancellations: current.cancellations,
            current_discount: current.avgDiscount,
            previous_orders: previous.orders,
            previous_sales: previous.sales,
            previous_revenue: previous.revenue,
            previous_cancellations: previous.cancellations,
            previous_discount: previous.avgDiscount,
            orders_change: calculateChange(current.orders, previous.orders),
            sales_change: calculateChange(current.sales, previous.sales),
            revenue_change: calculateChange(current.revenue, previous.revenue),
            cancellations_change: calculateChange(current.cancellations, previous.cancellations),
            discount_change: calculateChange(current.avgDiscount, previous.avgDiscount)
        })
    })
    
    return comparison
}

// Агрегация данных по датам для графиков
export const getChartDataByDate = (currentWeekOrders, previousWeekOrders) => {
    const allOrders = [...currentWeekOrders, ...previousWeekOrders]
    const ordersByDate = {}
    
    allOrders.forEach(order => {
        const orderDate = new Date(order.date)
        const dateKey = orderDate.toISOString().split('T')[0]
        
        if (!ordersByDate[dateKey]) {
            ordersByDate[dateKey] = []
        }
        ordersByDate[dateKey].push(order)
    })
    
    // Получаем все уникальные даты и сортируем их
    const allDates = Object.keys(ordersByDate).sort()
    
    // Если дат меньше 2, используем все доступные даты
    const periodDates = allDates.length > 0 ? allDates : []
    
    // Агрегируем данные для каждой даты
    const revenueByDay = []
    const salesByDay = []
    const cancellationsByDay = []
    const discountByDay = []
    
    periodDates.forEach(date => {
        const dayOrders = ordersByDate[date] || []
        
        const dayRevenue = dayOrders
            .filter(order => !order.is_cancel)
            .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0)
        
        const daySales = dayOrders.filter(order => !order.is_cancel).length
        const dayCancellations = dayOrders.filter(order => order.is_cancel).length
        
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
    const formattedLabels = periodDates.map(dateStr => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    })
        
    return {
        labels: formattedLabels,
        revenue: revenueByDay,
        sales: salesByDay,
        cancellations: cancellationsByDay,
        discount: discountByDay
    }
}

// Функция для получения данных по регионам для графика
export const getRegionsChartData = (currentWeekOrders, previousWeekOrders) => {
    const currentRegionsGrouped = groupByRegions(currentWeekOrders)
    const previousRegionsGrouped = groupByRegions(previousWeekOrders)
    
    const allRegions = new Set([
        ...Object.keys(currentRegionsGrouped),
        ...Object.keys(previousRegionsGrouped)
    ])
    
    const regionsData = Array.from(allRegions).map(regionName => {
        const current = currentRegionsGrouped[regionName] || { orders: 0 }
        const previous = previousRegionsGrouped[regionName] || { orders: 0 }
        
        return {
            region: regionName,
            current_orders: current.orders,
            previous_orders: previous.orders
        }
    })
    
    const topRegions = regionsData
        .sort((a, b) => (b.current_orders + b.previous_orders) - (a.current_orders + a.previous_orders))
        .slice(0, 10)
    
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

// Функции для фильтрации
export const filterOrders = (orders, filters = {}) => {
    return orders.filter(order => {
        // Фильтр по артикулу
        if (filters.nm_id && order.nm_id != filters.nm_id) return false
        
        // Фильтр по региону
        if (filters.region && order.oblast !== filters.region) return false
        
        // Фильтр по дате
        if (filters.dateFrom && new Date(order.date) < new Date(filters.dateFrom)) return false
        if (filters.dateTo && new Date(order.date) > new Date(filters.dateTo)) return false
        
        // Фильтр по категории
        if (filters.category && order.category !== filters.category) return false
        
        // Фильтр по бренду
        if (filters.brand && order.brand !== filters.brand) return false
        
        return true
    })
}

// Получить уникальные значения для фильтров
export const getFilterOptions = (orders) => {
    const regions = new Set()
    const categories = new Set()
    const brands = new Set()
    
    orders.forEach(order => {
        if (order.oblast) regions.add(order.oblast)
        if (order.category) categories.add(order.category)
        if (order.brand) brands.add(order.brand)
    })
    
    return {
        regions: Array.from(regions).sort(),
        categories: Array.from(categories).sort(),
        brands: Array.from(brands).sort()
    }
}