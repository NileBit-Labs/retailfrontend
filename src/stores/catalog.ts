import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch, apiErrorMessage } from '@/lib/api'
import type { PosProduct } from '@/types/sales'

const cacheKey = (shopId: number) => `pos_catalog_${shopId}`

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref<PosProduct[]>([])
  const loading = ref(false)
  const notice = ref('')

  async function load(shopId: number) {
    loading.value = true
    notice.value = ''
    try {
      products.value = await apiFetch<PosProduct[]>('/pos/products')
      localStorage.setItem(cacheKey(shopId), JSON.stringify(products.value))
    } catch (e) {
      const cached = localStorage.getItem(cacheKey(shopId))
      if (cached) {
        products.value = JSON.parse(cached)
        notice.value = 'Showing your saved catalogue — could not refresh it just now.'
      } else {
        notice.value = apiErrorMessage(e)
      }
    } finally {
      loading.value = false
    }
  }

  // Keeps the on-screen stock right after a sale without refetching everything.
  function adjustStock(productId: number, baseDelta: number, shopId: number) {
    const product = products.value.find((p) => p.id === productId)
    if (!product) return
    product.stock = Math.round((product.stock + baseDelta) * 1000) / 1000
    localStorage.setItem(cacheKey(shopId), JSON.stringify(products.value))
  }

  return { products, loading, notice, load, adjustStock }
})
