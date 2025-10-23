
<template>
  <div class="page-header">
    <h1>{{ title }}</h1>
    <p>Детальная информация по показателю</p>
    <button @click="$router.back()" class="back-btn">← Назад</button>
  </div>
</template>

<script>
export default {
  name: 'MetricHeader',
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>
<style scoped>
@import '@/styles/metric/metric_header.css';
</style>