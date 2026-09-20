<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import BarChart from '@/components/reports/BarChart.vue'
import DonutChart from '@/components/reports/DonutChart.vue'
import { apiErrorMessage, apiFetch } from '@/lib/api'
import { downloadCsv } from '@/lib/csv'
import { formatQuantity, formatUgx } from '@/lib/format'
import { paymentLabel, type PaymentMethod } from '@/types/sales'
import { METHOD_COLOURS, type Balances, type Overview, type ProductFigures } from '@/types/reports'

// Local calendar dates (not toISOString, which would shift the day near midnight).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const PRESETS = [
  { key: 'today', label: 'Today', range: () => [ymd(new Date()), ymd(new Date())] },
  { key: 'yesterday', label: 'Yesterday', range: () => [ymd(daysAgo(1)), ymd(daysAgo(1))] },
  { key: '7', label: 'Last 7 days', range: () => [ymd(daysAgo(6)), ymd(new Date())] },
  {
    key: 'month',
    label: 'This month',
    range: () => [
      ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      ymd(new Date()),
    ],
  },
  {
    key: 'last-month',
    label: 'Last month',
    range: () => [
      ymd(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
      ymd(new Date(new Date().getFullYear(), new Date().getMonth(), 0)),
    ],
  },
] as const

const tab = ref<'summary' | 'products' | 'owed'>('summary')
const preset = ref<string>('month')
const [initialFrom, initialTo] = PRESETS[3].range()
const from = ref(initialFrom)
const to = ref(initialTo)

const overview = ref<Overview | null>(null)
const products = ref<ProductFigures[] | null>(null)
const balances = ref<Balances | null>(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  const query = `from=${from.value}&to=${to.value}`
  try {
    if (tab.value === 'summary') {
      overview.value = await apiFetch<Overview>(`/reports/overview?${query}`)
    } else if (tab.value === 'products') {
      products.value = (
        await apiFetch<{ products: ProductFigures[] }>(`/reports/products?${query}`)
      ).products
    } else {
      balances.value = await apiFetch<Balances>('/reports/balances')
    }
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function pick(key: string) {
  const found = PRESETS.find((p) => p.key === key)
  if (!found) return
  preset.value = key
  ;[from.value, to.value] = found.range()
  overview.value = null
  products.value = null
  void load()
}

function customRange() {
  preset.value = 'custom'
  overview.value = null
  products.value = null
  void load()
}

function showTab(next: typeof tab.value) {
  tab.value = next
  void load()
}

const totals = computed(() => overview.value?.totals)
const margin = computed(() =>
  totals.value && totals.value.net_sales > 0
    ? Math.round((totals.value.gross_profit / totals.value.net_sales) * 100)
    : null,
)

const dayLabel = (date: string, short: boolean) => {
  const d = new Date(`${date}T12:00:00`)
  return short
    ? d.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric' })
    : String(d.getDate())
}

const chartPoints = computed(() => {
  const days = overview.value?.daily ?? []
  return days.map((d) => ({
    label: dayLabel(d.date, days.length <= 10),
    value: d.net_sales,
    title: `${d.date}: ${formatUgx(d.net_sales)} from ${d.sales_count} sale${d.sales_count === 1 ? '' : 's'}`,
  }))
})

const slices = computed(() => {
  const p = overview.value?.payments
  if (!p) return []
  const out = p.by_method.map((m) => ({
    label: paymentLabel(m.method as PaymentMethod),
    value: m.total,
    colour: METHOD_COLOURS[m.method] ?? METHOD_COLOURS.OTHER!,
  }))
  if (p.on_credit > 0)
    out.push({ label: 'On credit', value: p.on_credit, colour: METHOD_COLOURS.CREDIT! })
  return out
})

const slicesTotal = computed(() => slices.value.reduce((sum, s) => sum + s.value, 0))

function exportCsv() {
  const range = `${from.value}_to_${to.value}`
  if (tab.value === 'summary' && overview.value) {
    downloadCsv(`daily-sales-${range}.csv`, [
      ['Date', 'Sales', 'Refunds', 'Net sales', 'Cost of goods', 'Gross profit', 'Number of sales'],
      ...overview.value.daily.map((d) => [
        d.date,
        d.gross_sales,
        d.refunds,
        d.net_sales,
        d.cost,
        d.gross_profit,
        d.sales_count,
      ]),
    ])
  } else if (tab.value === 'products' && products.value) {
    downloadCsv(`products-${range}.csv`, [
      ['Product', 'Quantity sold', 'Revenue', 'Cost', 'Profit', 'Margin %'],
      ...products.value.map((p) => [p.name, p.quantity, p.revenue, p.cost, p.profit, p.margin]),
    ])
  } else if (tab.value === 'owed' && balances.value) {
    downloadCsv(`money-owed-${ymd(new Date())}.csv`, [
      ['Who', 'Name', 'Phone', 'Amount'],
      ...balances.value.receivable.rows.map((r) => [
        'Customer owes you',
        r.name,
        r.phone,
        r.balance,
      ]),
      ...balances.value.payable.rows.map((r) => ['You owe supplier', r.name, r.phone, r.balance]),
    ])
  }
}

const canExport = computed(
  () =>
    (tab.value === 'summary' && !!overview.value) ||
    (tab.value === 'products' && !!products.value?.length) ||
    (tab.value === 'owed' && !!balances.value),
)

onMounted(load)
</script>

<template>
  <main class="ui-page">
    <header class="ui-head">
      <div>
        <p class="ui-eyebrow">Finance</p>
        <h1>Reports</h1>
      </div>
      <div class="ui-actions">
        <button
          type="button"
          class="btn ui-btn-secondary"
          :disabled="!canExport"
          @click="exportCsv"
        >
          Download CSV
        </button>
      </div>
    </header>

    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'summary'"
        :class="{ active: tab === 'summary' }"
        @click="showTab('summary')"
      >
        Summary
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'products'"
        :class="{ active: tab === 'products' }"
        @click="showTab('products')"
      >
        Products
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'owed'"
        :class="{ active: tab === 'owed' }"
        @click="showTab('owed')"
      >
        Money owed
      </button>
    </div>

    <form v-if="tab !== 'owed'" class="ui-filters card" @submit.prevent="customRange">
      <div class="ui-chips wrap">
        <button
          v-for="p in PRESETS"
          :key="p.key"
          type="button"
          class="ui-chip"
          :class="{ active: preset === p.key }"
          @click="pick(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="field">
        <label for="r-from">From</label>
        <input id="r-from" v-model="from" type="date" :max="to" @change="customRange" />
      </div>
      <div class="field">
        <label for="r-to">To</label>
        <input id="r-to" v-model="to" type="date" :min="from" @change="customRange" />
      </div>
    </form>

    <p v-if="error" class="alert-danger">{{ error }}</p>

    <!-- Summary -->
    <template v-if="tab === 'summary'">
      <p v-if="loading && !overview" class="ui-state">Loading…</p>

      <template v-if="overview && totals">
        <section class="cards">
          <div class="card stat">
            <p class="label">Net sales</p>
            <p class="value">{{ formatUgx(totals.net_sales) }}</p>
            <p class="hint">
              {{ totals.sales_count }} sale{{ totals.sales_count === 1 ? '' : 's' }}, after refunds
            </p>
          </div>
          <div class="card stat">
            <p class="label">Gross profit</p>
            <p class="value">{{ formatUgx(totals.gross_profit) }}</p>
            <p class="hint">{{ margin === null ? 'No sales' : `${margin}% of net sales` }}</p>
          </div>
          <div class="card stat">
            <p class="label">Expenses</p>
            <p class="value">{{ formatUgx(totals.expenses) }}</p>
            <p class="hint"><RouterLink class="link" to="/expenses">See expenses</RouterLink></p>
          </div>
          <div class="card stat" :class="{ loss: totals.net_profit < 0 }">
            <p class="label">Net profit</p>
            <p class="value">
              {{ totals.net_profit < 0 ? '−' : '' }}{{ formatUgx(Math.abs(totals.net_profit)) }}
            </p>
            <p class="hint">Gross profit minus expenses</p>
          </div>
        </section>

        <section class="card panel">
          <div class="panel-head">
            <h2>Net sales by day</h2>
            <span class="panel-meta">{{ overview.period.from }} to {{ overview.period.to }}</span>
          </div>
          <div v-if="chartPoints.length <= 62" class="chart-space">
            <BarChart :points="chartPoints" empty-text="No sales in this period." :height="240" />
          </div>
          <p v-else class="ui-muted pad">
            The chart shows periods of up to two months. The table below has every day.
          </p>
        </section>

        <section class="two">
          <div class="card panel">
            <div class="panel-head">
              <h2>How the money was made</h2>
            </div>
            <dl class="lines">
              <div>
                <dt>Sales</dt>
                <dd>{{ formatUgx(totals.gross_sales) }}</dd>
              </div>
              <div v-if="totals.refunds">
                <dt>Refunds</dt>
                <dd class="neg">−{{ formatUgx(totals.refunds) }}</dd>
              </div>
              <div class="sum">
                <dt>Net sales</dt>
                <dd>{{ formatUgx(totals.net_sales) }}</dd>
              </div>
              <div>
                <dt>Cost of the goods sold</dt>
                <dd class="neg">−{{ formatUgx(totals.cost_of_goods) }}</dd>
              </div>
              <div class="sum">
                <dt>Gross profit</dt>
                <dd>{{ formatUgx(totals.gross_profit) }}</dd>
              </div>
              <div>
                <dt>Expenses</dt>
                <dd class="neg">−{{ formatUgx(totals.expenses) }}</dd>
              </div>
              <div class="sum">
                <dt>Net profit</dt>
                <dd :class="{ neg: totals.net_profit < 0 }">{{ formatUgx(totals.net_profit) }}</dd>
              </div>
            </dl>
            <p class="foot">
              Discounts given: {{ formatUgx(totals.discounts) }} · Average sale:
              {{ formatUgx(totals.average_sale) }} · Bought from suppliers:
              {{ formatUgx(totals.purchases) }}
            </p>
          </div>

          <div class="card panel">
            <div class="panel-head">
              <h2>Payments received</h2>
              <span class="panel-meta">By how customers paid</span>
            </div>
            <DonutChart
              :slices="slices"
              :centre-value="formatUgx(slicesTotal)"
              centre-label="in total"
              empty-label="No sales"
            />
          </div>
        </section>

        <section class="two">
          <div class="card ui-table-card">
            <h2 class="pad-head">By category</h2>
            <p v-if="!overview.by_category.length" class="ui-state small">
              Nothing sold in this period.
            </p>
            <div v-else class="ui-table-scroll">
              <table class="ui-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th class="num">Net sales</th>
                    <th class="num">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in overview.by_category" :key="c.category">
                    <td>{{ c.category }}</td>
                    <td class="num">{{ formatUgx(c.net_sales) }}</td>
                    <td class="num">{{ formatUgx(c.gross_profit) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card ui-table-card">
            <h2 class="pad-head">By cashier</h2>
            <p v-if="!overview.by_cashier.length" class="ui-state small">
              Nothing sold in this period.
            </p>
            <div v-else class="ui-table-scroll">
              <table class="ui-table">
                <thead>
                  <tr>
                    <th>Cashier</th>
                    <th class="num">Sales</th>
                    <th class="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="c in overview.by_cashier" :key="c.cashier_id">
                    <td>{{ c.name }}</td>
                    <td class="num">{{ c.sales_count }}</td>
                    <td class="num">{{ formatUgx(c.gross_sales) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="card ui-table-card">
          <h2 class="pad-head">Day by day</h2>
          <div class="ui-table-scroll">
            <table class="ui-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th class="num">Sales</th>
                  <th class="num">Refunds</th>
                  <th class="num">Net sales</th>
                  <th class="num">Profit</th>
                  <th class="num">Count</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="d in [...overview.daily].reverse()"
                  :key="d.date"
                  :class="{ quiet: d.sales_count === 0 && d.refunds === 0 }"
                >
                  <td>{{ d.date }}</td>
                  <td class="num">{{ formatUgx(d.gross_sales) }}</td>
                  <td class="num">{{ d.refunds ? `−${formatUgx(d.refunds)}` : '—' }}</td>
                  <td class="num">{{ formatUgx(d.net_sales) }}</td>
                  <td class="num">{{ formatUgx(d.gross_profit) }}</td>
                  <td class="num">{{ d.sales_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </template>

    <!-- Products -->
    <template v-else-if="tab === 'products'">
      <p v-if="loading && !products" class="ui-state">Loading…</p>
      <div v-else-if="products" class="card ui-table-card">
        <p v-if="!products.length" class="ui-state">Nothing sold in this period.</p>
        <div v-else class="ui-table-scroll">
          <table class="ui-table">
            <thead>
              <tr>
                <th>Product</th>
                <th class="num">Sold</th>
                <th class="num">Revenue</th>
                <th class="num">Cost</th>
                <th class="num">Profit</th>
                <th class="num">Margin</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in products" :key="p.product_id">
                <td>{{ p.name }}</td>
                <td class="num">{{ formatQuantity(p.quantity) }}</td>
                <td class="num">{{ formatUgx(p.revenue) }}</td>
                <td class="num">{{ formatUgx(p.cost) }}</td>
                <td class="num" :class="{ neg: p.profit < 0 }">{{ formatUgx(p.profit) }}</td>
                <td class="num">{{ p.margin === null ? '—' : `${p.margin}%` }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Money owed -->
    <template v-else>
      <p v-if="loading && !balances" class="ui-state">Loading…</p>
      <section v-else-if="balances" class="two">
        <div class="card ui-table-card">
          <div class="pad-head between">
            <h2>Customers owe you</h2>
            <strong>{{ formatUgx(balances.receivable.total) }}</strong>
          </div>
          <p v-if="!balances.receivable.rows.length" class="ui-state small">
            No customer owes you anything.
          </p>
          <div v-else class="ui-table-scroll">
            <table class="ui-table">
              <tbody>
                <tr v-for="r in balances.receivable.rows" :key="r.id">
                  <td>
                    <RouterLink class="link" :to="`/customers/${r.id}`">{{ r.name }}</RouterLink
                    ><small v-if="r.phone">{{ r.phone }}</small>
                  </td>
                  <td class="num neg">{{ formatUgx(r.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card ui-table-card">
          <div class="pad-head between">
            <h2>You owe suppliers</h2>
            <strong>{{ formatUgx(balances.payable.total) }}</strong>
          </div>
          <p v-if="!balances.payable.rows.length" class="ui-state small">
            You don't owe any supplier.
          </p>
          <div v-else class="ui-table-scroll">
            <table class="ui-table">
              <tbody>
                <tr v-for="r in balances.payable.rows" :key="r.id">
                  <td>
                    <RouterLink class="link" :to="`/suppliers/${r.id}`">{{ r.name }}</RouterLink
                    ><small v-if="r.phone">{{ r.phone }}</small>
                  </td>
                  <td class="num neg">{{ formatUgx(r.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.tabs {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.tabs button {
  min-height: 34px;
  padding: 0 1rem;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--color-ink-soft);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.tabs button.active {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.ui-chips.wrap {
  flex-wrap: wrap;
}

.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat {
  padding: 1rem 1.25rem;
}

.label {
  color: var(--color-ink-faint);
  font-size: 0.8125rem;
}

.value {
  margin-top: 0.125rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.stat.loss .value {
  color: var(--color-danger);
}

.hint {
  margin-top: 0.125rem;
  color: var(--color-ink-faint);
  font-size: 0.75rem;
}

.panel {
  padding: 1.25rem 1.5rem;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-head h2,
.pad-head h2,
h2.pad-head {
  font-size: 0.9375rem;
}

.panel-meta {
  font-size: 0.75rem;
  color: var(--color-ink-faint);
}

.chart-space {
  margin-top: 1.25rem;
}

.pad {
  margin-top: 1rem;
  font-size: 0.875rem;
}

.pad-head {
  padding: 1.25rem 1.5rem 0.5rem;
}

.pad-head.between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.lines {
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.lines div {
  display: flex;
  justify-content: space-between;
  font-size: 0.9375rem;
}

.lines dd {
  margin: 0;
}

.lines .sum {
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  font-weight: 700;
}

.neg {
  color: var(--color-danger);
}

.foot {
  margin-top: 1rem;
  color: var(--color-ink-faint);
  font-size: 0.75rem;
}

.quiet td {
  color: var(--color-ink-faint);
}

.ui-state.small {
  padding: 1.5rem 1rem;
  font-size: 0.875rem;
}

@media (max-width: 1000px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 860px) {
  .two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
