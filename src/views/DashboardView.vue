<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'
import NavIcon from '@/components/NavIcon.vue'
import BarChart from '@/components/reports/BarChart.vue'
import DonutChart from '@/components/reports/DonutChart.vue'
import { apiFetch } from '@/lib/api'
import { formatDateTime, formatQuantity, formatUgx } from '@/lib/format'
import { paymentLabel, type PaymentMethod } from '@/types/sales'
import { METHOD_COLOURS, type Dashboard } from '@/types/reports'

const auth = useAuthStore()
const shopStore = useShopStore()

const data = ref<Dashboard | null>(null)
const staleSince = ref<string | null>(null)
const loadError = ref('')

const isOwn = computed(() => data.value?.scope === 'own')

const today = computed(() =>
  new Date().toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long' }),
)

const cacheKey = () => `dashboard_${shopStore.currentShop?.id}`

// Last good figures are kept on the device so the screen isn't empty when the connection drops.
function readCache(): { at: string; data: Dashboard } | null {
  try {
    return JSON.parse(localStorage.getItem(cacheKey()) ?? 'null')
  } catch {
    return null
  }
}

async function load() {
  if (!shopStore.currentShop) return
  try {
    data.value = await apiFetch<Dashboard>('/dashboard')
    staleSince.value = null
    loadError.value = ''
    try {
      localStorage.setItem(
        cacheKey(),
        JSON.stringify({ at: new Date().toISOString(), data: data.value }),
      )
    } catch {
      // Storage full or blocked: the live figures still show.
    }
  } catch {
    const cached = readCache()
    if (cached) {
      data.value = cached.data
      staleSince.value = cached.at
    } else {
      loadError.value = "Can't reach the server yet. Figures will appear once you're connected."
    }
  }
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  const cached = readCache()
  if (cached) data.value = cached.data
  void load()
  timer = setInterval(() => {
    if (!document.hidden) void load()
  }, 60_000)
})
onUnmounted(() => clearInterval(timer))
watch(
  () => shopStore.currentShop?.id,
  () => void load(),
)

const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : formatUgx(n))

const stats = computed(() => {
  const d = data.value
  if (!d) return []
  if (d.scope === 'own') {
    return [
      {
        label: 'My sales today',
        value: money(d.today.net_sales),
        hint: 'Everything you sold today',
        icon: 'sell',
      },
      {
        label: 'Sales made',
        value: String(d.today.sales_count),
        hint: d.today.sales_count
          ? `Average ${formatUgx(Math.round(d.today.gross_sales / d.today.sales_count))}`
          : 'None yet today',
        icon: 'sales',
      },
    ]
  }
  return [
    {
      label: "Today's sales",
      value: money(d.today.net_sales),
      hint: d.today.sales_count
        ? `${d.today.sales_count} sale${d.today.sales_count === 1 ? '' : 's'}, after refunds`
        : 'No sales recorded yet',
      icon: 'sell',
    },
    {
      label: 'Gross profit (est.)',
      value: money(d.today.gross_profit),
      hint: 'Sales minus what the items cost',
      icon: 'reports',
    },
    { label: 'Expenses', value: money(d.today.expenses), hint: 'Recorded today', icon: 'expenses' },
    {
      label: 'Low stock items',
      value: String(d.low_stock?.count ?? 0),
      hint: 'At or below reorder level',
      icon: 'products',
    },
  ]
})

const weekPoints = computed(() =>
  (data.value?.week ?? []).map((day, i, all) => {
    const date = new Date(`${day.date}T12:00:00`)
    return {
      label: date.toLocaleDateString('en-UG', { weekday: 'short' }),
      value: day.net_sales,
      title: `${date.toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'short' })}: ${formatUgx(day.net_sales)} (${day.sales_count} sale${day.sales_count === 1 ? '' : 's'})`,
      highlight: i === all.length - 1,
    }
  }),
)

const weekTotal = computed(() => (data.value?.week ?? []).reduce((sum, d) => sum + d.net_sales, 0))

const paymentSlices = computed(() => {
  const p = data.value?.payments
  if (!p) return []
  const slices = p.by_method.map((m) => ({
    label: paymentLabel(m.method as PaymentMethod),
    value: m.total,
    colour: METHOD_COLOURS[m.method] ?? METHOD_COLOURS.OTHER!,
  }))
  if (p.on_credit > 0)
    slices.push({ label: 'On credit', value: p.on_credit, colour: METHOD_COLOURS.CREDIT! })
  return slices
})

const paymentTotal = computed(() => paymentSlices.value.reduce((sum, s) => sum + s.value, 0))

const setupSteps = computed(() => [
  { label: 'Create your account', done: true },
  { label: `Set up "${shopStore.currentShop?.name ?? 'your shop'}"`, done: true },
  { label: 'Add your products', done: !!data.value?.setup?.has_products, to: '/products' },
  { label: 'Make your first sale', done: !!data.value?.setup?.has_sales, to: '/pos' },
])

const setupProgress = computed(() => {
  const done = setupSteps.value.filter((s) => s.done).length
  return { done, total: setupSteps.value.length, percent: (done / setupSteps.value.length) * 100 }
})

const setupComplete = computed(() => setupProgress.value.done === setupProgress.value.total)

const EVENT_ICONS: Record<string, string> = {
  sale: 'sell',
  refund: 'sales',
  purchase: 'purchases',
  expense: 'expenses',
}
</script>

<template>
  <main class="dashboard">
    <div class="dashboard-header">
      <div>
        <p class="eyebrow">{{ shopStore.currentShop?.name }} · {{ today }}</p>
        <h1>Welcome back, {{ auth.user?.name?.split(' ')[0] }}</h1>
      </div>
      <RouterLink v-if="isOwn" class="btn btn-primary" to="/pos">Start selling</RouterLink>
    </div>

    <p v-if="staleSince" class="stale" role="status">
      You're offline. Showing figures from {{ formatDateTime(staleSince) }}.
    </p>
    <p v-if="loadError" class="alert-danger">{{ loadError }}</p>

    <section class="stat-grid" :class="{ two: isOwn }">
      <template v-if="data">
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
      </template>
      <template v-else>
        <div v-for="n in 4" :key="n" class="stat-card card skeleton" aria-hidden="true" />
      </template>
    </section>

    <section class="chart-row">
      <div class="card panel">
        <div class="panel-head">
          <h2>Sales this week</h2>
          <span class="panel-meta">{{ formatUgx(weekTotal) }} in 7 days</span>
        </div>
        <div class="chart-space">
          <BarChart
            :points="weekPoints"
            empty-text="No sales yet. Your week's sales will chart here."
          />
        </div>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2>Payment split</h2>
          <span class="panel-meta">Today</span>
        </div>
        <DonutChart
          :slices="paymentSlices"
          :centre-value="formatUgx(paymentTotal)"
          centre-label="sold today"
          empty-label="No sales yet"
        />
      </div>
    </section>

    <template v-if="data && !isOwn">
      <section class="lower-row">
        <div class="card panel">
          <div class="panel-head">
            <h2>Top products</h2>
            <span class="panel-meta">Last 7 days</span>
          </div>

          <template v-if="data.top_products?.length">
            <div class="table-head">
              <span>Product</span>
              <span class="r">Sold</span>
              <span class="r">Revenue</span>
            </div>
            <div v-for="p in data.top_products" :key="p.product_id" class="row">
              <span class="name">{{ p.name }}</span>
              <span class="r">{{ formatQuantity(p.quantity) }}</span>
              <span class="r">{{ formatUgx(p.revenue) }}</span>
            </div>
          </template>
          <p v-else class="empty-note">Nothing sold yet. Your best sellers will rank here.</p>
        </div>

        <div class="card panel">
          <div class="panel-head">
            <h2>Low stock alerts</h2>
            <span class="panel-meta"
              >{{ data.low_stock?.count ?? 0 }} item{{
                data.low_stock?.count === 1 ? '' : 's'
              }}</span
            >
          </div>

          <ul v-if="data.low_stock?.items.length" class="low">
            <li v-for="item in data.low_stock.items" :key="item.id">
              <RouterLink class="name link" :to="`/inventory?product=${item.id}`">{{
                item.name
              }}</RouterLink>
              <span :class="item.stock <= 0 ? 'out' : 'warn'">
                {{
                  item.stock <= 0
                    ? 'Out of stock'
                    : `${formatQuantity(item.stock)} ${item.unit} left`
                }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-note">
            All good. Nothing is running low. Products at or below their reorder level will appear
            here.
          </p>
          <RouterLink v-if="data.low_stock?.count" class="link more" to="/inventory"
            >See all stock</RouterLink
          >
        </div>

        <div v-if="!setupComplete" class="card panel">
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
              <RouterLink v-if="!step.done && step.to" class="link" :to="step.to">{{
                step.label
              }}</RouterLink>
              <template v-else>{{ step.label }}</template>
            </li>
          </ul>
        </div>

        <div v-else class="card panel">
          <div class="panel-head">
            <h2>Money position</h2>
            <span class="panel-meta">Right now</span>
          </div>
          <dl class="position">
            <div>
              <dt>Customers owe you</dt>
              <dd>{{ formatUgx(data.owed_by_customers ?? 0) }}</dd>
            </div>
            <div>
              <dt>You owe suppliers</dt>
              <dd>{{ formatUgx(data.owed_to_suppliers ?? 0) }}</dd>
            </div>
            <div>
              <dt>Stock on the shelf (at cost)</dt>
              <dd>{{ formatUgx(data.stock_value ?? 0) }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div class="card panel">
          <div class="panel-head">
            <h2>Recent activity</h2>
          </div>
          <ul v-if="data.recent?.length" class="activity">
            <li v-for="(event, i) in data.recent" :key="i">
              <span class="ev-icon"><NavIcon :name="EVENT_ICONS[event.type] ?? 'sales'" /></span>
              <RouterLink class="ev-title link" :to="event.link">{{ event.title }}</RouterLink>
              <span class="ev-by">{{ event.by }}</span>
              <span class="ev-when">{{ formatDateTime(event.at) }}</span>
              <span class="ev-amount" :class="{ neg: event.amount < 0 }">
                {{ event.amount < 0 ? '−' : '' }}{{ formatUgx(Math.abs(event.amount)) }}
              </span>
            </li>
          </ul>
          <p v-else class="empty-note">
            Sales, stock changes, and payments will show up here as they happen.
          </p>
        </div>
      </section>
    </template>
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
  color: var(--color-on-primary);
}

/* Tables / empty states */
.table-head {
  display: grid;
  grid-template-columns: 1fr 60px 110px;
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

.dashboard-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.stale {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--color-canvas);
  border: 1px solid var(--color-border);
  color: var(--color-ink-soft);
  font-size: 0.8125rem;
}

.stat-grid.two {
  grid-template-columns: repeat(2, 1fr);
}

.skeleton {
  min-height: 108px;
  background: linear-gradient(
    90deg,
    var(--color-surface),
    var(--color-canvas),
    var(--color-surface)
  );
}

.chart-space {
  margin-top: 1.5rem;
}

.r {
  text-align: right;
}

.row {
  display: grid;
  grid-template-columns: 1fr 60px 110px;
  gap: 0.5rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.row:last-child {
  border-bottom: none;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.low {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}

.low li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.low li:last-child {
  border-bottom: none;
}

.warn {
  color: #b45309;
  font-weight: 600;
  white-space: nowrap;
}

.out {
  color: var(--color-danger);
  font-weight: 600;
  white-space: nowrap;
}

.more {
  display: inline-block;
  margin-top: 0.75rem;
  font-size: 0.8125rem;
}

.position {
  margin: 1.25rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.position div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
}

.position dt {
  color: var(--color-ink-soft);
}

.position dd {
  margin: 0;
  font-weight: 600;
}

.activity {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
}

.activity li {
  display: grid;
  grid-template-columns: 28px minmax(0, 1.5fr) minmax(0, 1fr) 150px 120px;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.activity li:last-child {
  border-bottom: none;
}

.ev-icon {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-canvas);
  color: var(--color-ink-soft);
}

.ev-by,
.ev-when {
  color: var(--color-ink-faint);
  font-size: 0.8125rem;
}

.ev-amount {
  font-weight: 600;
  text-align: right;
}

.ev-amount.neg {
  color: var(--color-danger);
}

@media (max-width: 860px) {
  .activity li {
    grid-template-columns: 28px 1fr auto;
  }

  .ev-by,
  .ev-when {
    display: none;
  }
}
</style>
