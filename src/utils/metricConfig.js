// Конфигурация для метрик
export const metricConfig = {
  sales: {
    title: 'Динамика продаж',
    chartComponent: 'SalesChart',
    tableHeaders: [
      { key: 'nm_id', label: 'Артикул', sortable: false },
      { key: 'current_revenue', label: 'Текущая выручка', sortable: true },
      { key: 'previous_revenue', label: 'Предыдущая выручка', sortable: true },
      { key: 'revenue_change', label: 'Изменение', sortable: true }
    ],
    valueFields: {
      current: 'current_revenue',
      previous: 'previous_revenue',
      change: 'revenue_change'
    },
    chartConfig: {
      dataset: 'revenue',
      label: 'Выручка, руб.',
      color: '#f87979'
    }
  },
  discount: {
    title: 'Средний процент скидки',
    chartComponent: 'DiscountChart',
    tableHeaders: [
      { key: 'nm_id', label: 'Артикул', sortable: false },
      { key: 'current_discount', label: 'Текущая скидка', sortable: true },
      { key: 'previous_discount', label: 'Предыдущая скидка', sortable: true },
      { key: 'discount_change', label: 'Изменение', sortable: true }
    ],
    valueFields: {
      current: 'current_discount',
      previous: 'previous_discount',
      change: 'discount_change'
    },
    chartConfig: {
      dataset: 'discount',
      label: 'Средняя скидка, %',
      color: 'rgb(255, 99, 132)'
    }
  },
  cancels: {
    title: 'Уровень отмен',
    chartComponent: 'CancelsChart',
    tableHeaders: [
      { key: 'nm_id', label: 'Артикул', sortable: false },
      { key: 'current_cancellations', label: 'Текущие отмены', sortable: true },
      { key: 'previous_cancellations', label: 'Предыдущие отмены', sortable: true },
      { key: 'cancellations_change', label: 'Изменение', sortable: true }
    ],
    valueFields: {
      current: 'current_cancellations',
      previous: 'previous_cancellations',
      change: 'cancellations_change'
    },
    chartConfig: {
      dataset: 'cancellations',
      label: 'Количество отмен',
      color: 'rgb(255, 159, 64)'
    }
  },
  regions: {
    title: 'Распределение по регионам',
    chartComponent: 'RegionsChart',
    tableHeaders: [
      { key: 'region', label: 'Регион', sortable: false },
      { key: 'current_orders', label: 'Текущие заказы', sortable: true },
      { key: 'previous_orders', label: 'Предыдущие заказы', sortable: true },
      { key: 'orders_change', label: 'Изменение', sortable: true }
    ],
    valueFields: {
      current: 'current_orders',
      previous: 'previous_orders',
      change: 'orders_change'
    },
    chartConfig: {
      isRegions: true
    }
  }
}

// Функция для округления чисел до сотых
const roundToThousandths = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return value
  return Math.round(value * 100) / 100
}

// Форматирование значений
export const formatValue = (value, metricId) => {
  // Сначала округляем все числовые значения до сотых
  const roundedValue = roundToThousandths(value)
  
  if (metricId === 'sales') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(roundedValue)
  } else if (metricId === 'discount') {
    return roundedValue.toFixed(1) + '%'
  } else {
    // Для остальных метрик возвращаем округленное значение
    // Если число целое - показываем без дробной части, иначе с дробной
    return Number.isInteger(roundedValue) ? roundedValue : roundedValue.toFixed(2)
  }
}

// Классы для изменений
export const getChangeClass = (change) => {
  if (change > 0) return 'positive-change'
  if (change < 0) return 'negative-change'
  return 'neutral-change'
}