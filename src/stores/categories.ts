import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '@/lib/api'
import type { Category } from '@/types/inventory'

export const useCategoriesStore = defineStore('categories', () => {
  const list = ref<Category[]>([])

  async function load() {
    list.value = await apiFetch<Category[]>('/categories')
  }

  return { list, load }
})
