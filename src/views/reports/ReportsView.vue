<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import '@/assets/charts.css'
import '@/assets/reports.css'
import { DEFAULT_TIMEZONE, todayIn } from '@/lib/dates'
import { useAuthStore } from '@/stores/auth'
import DebtTab from './DebtTab.vue'
import ProfitTab from './ProfitTab.vue'
import SalesTab from './SalesTab.vue'
import StockTab from './StockTab.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const today = computed(() => todayIn(auth.user?.organization?.timezone ?? DEFAULT_TIMEZONE))

const tabs = computed(() => [
  { key: 'sales', label: 'Sales' },
  // Cost and profit are the owner's alone; the server refuses everyone else too.
  ...(auth.isOwner ? [{ key: 'profit', label: 'Profit' }] : []),
  { key: 'stock', label: 'Stock' },
  { key: 'debt', label: 'Customer debt' },
])

const active = computed(() => {
  const asked = String(route.query.tab ?? 'sales')
  return tabs.value.some((t) => t.key === asked) ? asked : 'sales'
})

function open(key: string) {
  void router.replace({ query: { tab: key } })
}
</script>

<template>
  <main class="page">
    <header>
      <p class="eyebrow">Finance</p>
      <h1>Reports</h1>
    </header>

    <nav class="tabs" role="tablist" aria-label="Reports">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: active === t.key }"
        :aria-selected="active === t.key"
        @click="open(t.key)"
      >
        {{ t.label }}
      </button>
    </nav>

    <SalesTab v-if="active === 'sales'" :today="today" />
    <ProfitTab v-else-if="active === 'profit'" :today="today" />
    <StockTab v-else-if="active === 'stock'" />
    <DebtTab v-else-if="active === 'debt'" />
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.tabs {
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
}

.tab {
  padding: 0.625rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: none;
  color: var(--color-ink-soft);
  font-size: 0.9375rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.tab:hover {
  color: var(--color-ink);
}

.tab.on {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 720px) {
  .page {
    padding: 1.25rem 1rem;
  }
}
</style>
