<template>
  <div class="pagination" v-if="totalPages > 1">
    <div class="pagination-info">
      Показано {{ startItem }}-{{ endItem }} из {{ totalItems }}
    </div>
    
    <div class="pagination-controls">
      <button 
        @click="goToPage(currentPage - 1)" 
        :disabled="currentPage === 1" 
        class="pagination-btn"
      >
        ← Назад
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in displayedPages" 
          :key="page"
          @click="goToPage(page)"
          :class="{ 'active': page === currentPage }"
          class="page-btn"
        >
          {{ page }}
        </button>
        
        <span v-if="displayedPages[displayedPages.length - 1] < totalPages" class="page-ellipsis">
          ...
        </span>
      </div>
      
      <button 
        @click="goToPage(currentPage + 1)" 
        :disabled="currentPage === totalPages" 
        class="pagination-btn"
      >
        Вперед →
      </button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'MetricPagination',
  props: {
    currentPage: {
      type: Number,
      required: true
    },
    totalPages: {
      type: Number,
      required: true
    },
    totalItems: {
      type: Number,
      required: true
    },
    itemsPerPage: {
      type: Number,
      required: true
    }
  },
  emits: ['page-change'],
  setup(props, { emit }) {
    const startItem = computed(() => ((props.currentPage - 1) * props.itemsPerPage) + 1)
    const endItem = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems))

    const displayedPages = computed(() => {
      const pages = []
      const maxVisiblePages = 5
      
      let startPage = Math.max(1, props.currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(props.totalPages, startPage + maxVisiblePages - 1)
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    })

    const goToPage = (page) => {
      if (page >= 1 && page <= props.totalPages) {
        emit('page-change', page)
      }
    }

    return {
      startItem,
      endItem,
      displayedPages,
      goToPage
    }
  }
}
</script>

<style scoped>
@import '@/styles/metric/metric_pagination.css';
</style>