<template>
  <div v-if="loading" class="loading-overlay" :class="{ 'fullscreen': fullscreen }">
    <div class="loading-container">
      <div class="loading-spinner">
        <div class="spinner-circle"></div>
        <div class="spinner-circle"></div>
        <div class="spinner-circle"></div>
        <div class="spinner-circle"></div>
      </div>
      <div class="loading-text">
        <slot>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    loading: {
      type: Boolean,
      required: true
    },
    fullscreen: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: 'Загрузка аналитики Wildberries'
    },
    message: {
      type: String,
      default: 'Собираем данные о продажах, скидках и отменах...'
    }
  }
}
</script>

<style scoped>
@import '@/styles/loading_spinner.css';
</style>