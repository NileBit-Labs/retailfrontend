<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'
import NavIcon from '@/components/NavIcon.vue'

const auth = useAuthStore()
const shopStore = useShopStore()

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
  { label: "Today's sales", value: formatUgx(0), hint: 'No sales recorded yet', icon: 'sell' },
  {
    label: 'Gross profit (est.)',
    value: formatUgx(0),
    hint: 'Based on item costs',
    icon: 'reports',
  },
  { label: 'Expenses', value: formatUgx(0), hint: 'Recorded today', icon: 'expenses' },
  { label: 'Low stock items', value: '0', hint: 'Below reorder level', icon: 'products' },
])

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const paymentMethods = [
  { label: 'Cash', color: '#0f766e' },
  { label: 'Mobile Money', color: '#d97706' },
  { label: 'Card', color: '#6366f1' },
  { label: 'Bank', color: '#64748b' },
]

const setupSteps = computed(() => [
  { label: 'Create your account', done: true },
  { label: `Set up "${shopStore.currentShop?.name ?? 'your shop'}"`, done: true },
  { label: 'Add your products', done: false },
  { label: 'Make your first sale', done: false },
])

const setupProgress = computed(() => {
  const done = setupSteps.value.filter((s) => s.done).length
  return { done, total: setupSteps.value.length, percent: (done / setupSteps.value.length) * 100 }
})
</script>

<template>
  <main class="dashboard">
    <div class="dashboard-header">
      <p class="eyebrow">{{ shopStore.currentShop?.name }} · {{ today }}</p>
      <h1>Welcome back, {{ auth.user?.name?.split(' ')[0] }}</h1>
    </div>

    <section class="stat-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card">
        <div class="stat-icon-badge">
          <NavIcon :name="stat.icon" />
        </div>
        <div class="stat-body">
          <p class="stat-label">{{ stat.label }}</p>
          <p class="stat-value">{{ stat.value }}</p>
          <p class="stat-hint">{{ stat.hint }}</p>
        </div>
      </div>
    </section>

    <section class="chart-row">
      <div class="card panel">
        <div class="panel-head">
          <h2>Sales this week</h2>
          <span class="panel-meta">UGX</span>
        </div>

        <div class="bar-chart">
          <div class="gridlines">
            <span v-for="n in 4" :key="n" class="gridline" />
          </div>
          <div class="bars">
            <div v-for="day in weekDays" :key="day" class="bar-col">
              <div class="bar" />
              <span class="bar-label">{{ day }}</span>
            </div>
          </div>
          <p class="chart-empty">No sales yet — your week's sales will chart here.</p>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Payment split</h2>
          <span class="panel-meta">Today</span>
        </div>

        <div class="donut-wrap">
          <div class="donut">
            <div class="donut-center">
              <span class="donut-value">—</span>
              <span class="donut-label">No payments yet</span>
            </div>
          </div>
        </div>

        <ul class="legend">
          <li v-for="method in paymentMethods" :key="method.label">
            <span class="legend-dot" :style="{ background: method.color }" />
            <span class="legend-label">{{ method.label }}</span>
            <span class="legend-value">0%</span>
          </li>
        </ul>
      </div>
    </section>

    <section class="lower-row">
      <div class="card panel">
        <div class="panel-head">
          <h2>Get set up</h2>
          <span class="panel-meta">{{ setupProgress.done }} of {{ setupProgress.total }}</span>
        </div>

        <div class="progress-track">
          <div class="progress-fill" :style="{ width: setupProgress.percent + '%' }" />
        </div>

        <ul class="checklist">
          <li v-for="step in setupSteps" :key="step.label" :class="{ done: step.done }">
            <span class="checkbox">{{ step.done ? '✓' : '' }}</span>
            {{ step.label }}
          </li>
        </ul>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Top products</h2>
          <span class="panel-meta">This week</span>
        </div>

        <div class="table-head">
          <span>Product</span>
          <span>Sold</span>
          <span>Revenue</span>
        </div>
        <p class="empty-note">Nothing sold yet — your best sellers will rank here.</p>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Low stock alerts</h2>
          <span class="panel-meta">0 items</span>
        </div>

        <p class="empty-note">
          All good — nothing is running low. Products that fall below their reorder level will
          appear here.
        </p>
      </div>
    </section>

    <section>
      <div class="card panel">
        <div class="panel-head">
          <h2>Recent activity</h2>
        </div>
        <p class="empty-note">
          Sales, stock changes, and payments will show up here as they happen.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  flex: 1;
  padding: 2rem 2rem 3rem;
  max-width: 1760px;
  margin: 0 auto;
  width: 100%;
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
}

.stat-icon-badge {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.stat-label {
  font-size: 0.8125rem;
  color: var(--color-ink-faint);
}

.stat-value {
  margin-top: 0.25rem;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.stat-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-ink-faint);
}

.chart-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
}

.lower-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.panel {
  padding: 1.5rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head h2 {
  font-size: 0.9375rem;
}

.panel-meta {
  font-size: 0.75rem;
  color: var(--color-ink-faint);
}

/* Bar chart (empty state) */
.bar-chart {
  position: relative;
  height: 260px;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
}

.gridlines {
  position: absolute;
  inset: 0 0 1.75rem 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.gridline {
  border-top: 1px dashed var(--color-border);
}

.bars {
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
  align-items: end;
  padding: 0 0.5rem;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar {
  width: 100%;
  max-width: 44px;
  height: 3px;
  border-radius: 2px;
  background: var(--color-border-strong);
}

.bar-label {
  font-size: 0.75rem;
  color: var(--color-ink-faint);
}

.chart-empty {
  position: absolute;
  inset: 0 0 1.75rem 0;
  display: grid;
  place-items: center;
  font-size: 0.875rem;
  color: var(--color-ink-faint);
  pointer-events: none;
}

/* Donut (empty state) */
.donut-wrap {
  display: grid;
  place-items: center;
  margin: 1.5rem 0;
}

.donut {
  position: relative;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: conic-gradient(var(--color-border) 0 100%);
}

.donut::after {
  content: '';
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: var(--color-surface);
}

.donut-center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
}

.donut-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.donut-label {
  font-size: 0.6875rem;
  color: var(--color-ink-faint);
}

.legend {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8125rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: var(--color-ink-soft);
}

.legend-value {
  color: var(--color-ink-faint);
}

/* Checklist */
.progress-track {
  height: 6px;
  margin-top: 1rem;
  border-radius: 3px;
  background: var(--color-border);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--color-primary);
  transition: width 0.3s;
}

.checklist {
  list-style: none;
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0;
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

/* Tables / empty states */
.table-head {
  display: grid;
  grid-template-columns: 1fr 60px 90px;
  gap: 0.5rem;
  margin-top: 1.25rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.empty-note {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-ink-faint);
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .lower-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 860px) {
  .dashboard {
    padding: 1.5rem 1rem 2rem;
  }
  .chart-row,
  .lower-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
