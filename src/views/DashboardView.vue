<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'
import NavIcon from '@/components/NavIcon.vue'

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

function formatUgx(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

const today = computed(() =>
  new Date().toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long' }),
)

const stats = computed(() => [
  { label: "Today's sales", value: formatUgx(0), icon: 'sell' },
  { label: 'Gross profit (est.)', value: formatUgx(0), icon: 'reports' },
  { label: 'Expenses', value: formatUgx(0), icon: 'expenses' },
  { label: 'Low stock items', value: '0', icon: 'products' },
])

const setupSteps = computed(() => [
  { label: 'Create your account', done: true },
  { label: `Set up "${shopStore.currentShop?.name ?? 'your shop'}"`, done: true },
  { label: 'Add your products', done: false },
  { label: 'Make your first sale', done: false },
])
</script>

<template>
  <main class="dashboard">
    <div class="dashboard-header">
      <p class="eyebrow">{{ shopStore.currentShop?.name }} · {{ today }}</p>
      <h1>Welcome back, {{ auth.user?.name?.split(' ')[0] }}</h1>
    </div>

    <div class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card">
        <NavIcon :name="stat.icon" class="stat-icon" />
        <div>
          <p class="stat-label">{{ stat.label }}</p>
          <p class="stat-value">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card panel">
        <h2>Get set up</h2>
        <ul class="checklist">
          <li v-for="step in setupSteps" :key="step.label" :class="{ done: step.done }">
            <span class="checkbox">{{ step.done ? '✓' : '' }}</span>
            {{ step.label }}
          </li>
        </ul>
      </div>

      <div class="card panel">
        <h2>Top products</h2>
        <p class="empty-note">Nothing sold yet — this fills in once the POS module is live.</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dashboard {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1040px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-header {
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-ink-faint);
}

.stat-value {
  margin-top: 0.25rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.panel {
  padding: 1.5rem;
}

.panel h2 {
  font-size: 0.9375rem;
}

.checklist {
  list-style: none;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checklist li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.875rem;
  color: var(--color-ink-faint);
}

.checklist li.done {
  color: var(--color-ink);
}

.checkbox {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--color-border-strong);
  font-size: 0.6875rem;
  flex-shrink: 0;
}

.checklist li.done .checkbox {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.empty-note {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-ink-faint);
}

@media (max-width: 860px) {
  .stat-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
