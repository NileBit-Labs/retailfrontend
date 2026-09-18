<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'

const auth = useAuthStore()
const shopStore = useShopStore()
const router = useRouter()

onMounted(async () => {
  if (!auth.user) {
    await auth.fetchMe()
  }
  if (!shopStore.currentShop) {
    await router.push('/setup/shop')
  }
})
</script>

<template>
  <main class="home-page">
    <div class="home-header">
      <p class="eyebrow">{{ shopStore.currentShop?.name }}</p>
      <h1>Welcome back, {{ auth.user?.name?.split(' ')[0] }}</h1>
    </div>

    <div class="placeholder card">
      <p>
        The dashboard, sales, inventory, customers, and reports modules land here as each person's
        track is built out.
      </p>
    </div>
  </main>
</template>

<style scoped>
.home-page {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.home-header {
  margin-bottom: 1.5rem;
}

.eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary);
}

h1 {
  margin-top: 0.25rem;
  font-size: 1.5rem;
}

.placeholder {
  padding: 1.5rem;
  color: var(--color-ink-soft);
  font-size: 0.9375rem;
}
</style>
