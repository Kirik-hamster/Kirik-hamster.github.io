<template>
  <div class="article-page">
    <div class="page-header">
      <h1>Артикул {{ articleId }}</h1>
      <button @click="$router.back()" class="back-btn">← Назад</button>
    </div>
    
    <div class="article-content">
      <!-- Левая часть - информация (1/3 ширины) -->
      <div class="article-info">
        <div class="image-placeholder">
          <span>🖼️ Заглушка фотокарточки для артикула {{ articleId }}</span>
        </div>
        <div class="article-details">
          <h3>Информация об артикуле</h3>
          <p><strong>Артикул:</strong> {{ articleId }}</p>
          <p><strong>Бренд:</strong> {{ articleData.brand || 'Не указан' }}</p>
          <p><strong>Категория:</strong> {{ articleData.category || 'Не указана' }}</p>
          <p><strong>Размер:</strong> {{ articleData.size || 'Не указан' }}</p>
          <p><strong>Регион:</strong> {{ articleData.region || 'Не указан' }}</p>
        </div>
      </div>
      
      <!-- Правая часть - таблица показателей (2/3 ширины) -->
      <div class="metrics-table">
        <h3>Показатели по датам</h3>
        <table class="metrics-data">
          <thead>
            <tr>
              <th>Показатель</th>
              <th v-for="date in dates" :key="date">{{ formatDate(date) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="metric in metrics" :key="metric.name">
              <td><strong>{{ metric.name }}</strong></td>
              <td v-for="date in dates" :key="date" :class="getValueClass(metric.values[date])">
                {{ formatMetricValue(metric.name, metric.values[date]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ArticlePage',
  data() {
    return {
      articleData: {},
      dates: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
      metrics: [
        { 
          name: 'Продажи', 
          values: { 
            '2024-01-01': '150', 
            '2024-01-02': '200', 
            '2024-01-03': '180',
            '2024-01-05': '220'
          } 
        },
        { 
          name: 'Выручка', 
          values: { 
            '2024-01-01': '15000', 
            '2024-01-02': '20000', 
            '2024-01-03': '18000',
            '2024-01-04': '25000'
          } 
        },
        { 
          name: 'Скидка %', 
          values: { 
            '2024-01-01': '15', 
            '2024-01-02': '10', 
            '2024-01-04': '20' 
          } 
        },
        { 
          name: 'Отмены', 
          values: { 
            '2024-01-02': '2', 
            '2024-01-04': '1' 
          } 
        }
      ]
    }
  },
  computed: {
    articleId() {
      return this.$route.params.id
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU')
    },
    formatMetricValue(metricName, value) {
      if (!value) return '-'
      if (metricName === 'Выручка') {
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(value)
      }
      return value
    },
    getValueClass(value) {
      if (!value) return 'no-data'
      return 'has-data'
    },
    loadArticleData() {
      this.articleData = {
        brand: 'Пример бренда',
        category: 'Пример категории', 
        size: '42-44',
        region: 'Московская область'
      }
    }
  },
  mounted() {
    this.loadArticleData()
  }
}
</script>

<style scoped>
@import '@/styles/article_page.css';
</style>