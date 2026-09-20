<script setup lang="ts">
import { computed } from 'vue'
import { formatUgx } from '@/lib/format'

const props = defineProps<{
  slices: { label: string; value: number; colour: string }[]
  centreValue: string
  centreLabel: string
  emptyLabel: string
}>()

const total = computed(() => props.slices.reduce((sum, s) => sum + s.value, 0))

const gradient = computed(() => {
  if (total.value <= 0) return 'conic-gradient(var(--color-border) 0 100%)'
  let at = 0
  const stops = props.slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const from = at
      at += (s.value / total.value) * 100
      return `${s.colour} ${from}% ${at}%`
    })
  return `conic-gradient(${stops.join(', ')})`
})

const percent = (value: number) => (total.value > 0 ? Math.round((value / total.value) * 100) : 0)
</script>

<template>
  <div>
    <div class="donut-wrap">
      <div
        class="donut"
        :style="{ background: gradient }"
        role="img"
        :aria-label="`${centreLabel}: ${centreValue}`"
      >
        <div class="donut-centre">
          <span class="donut-value">{{ total > 0 ? centreValue : '—' }}</span>
          <span class="donut-label">{{ total > 0 ? centreLabel : emptyLabel }}</span>
        </div>
      </div>
    </div>

    <ul class="legend">
      <li v-for="s in slices" :key="s.label">
        <span class="legend-dot" :style="{ background: s.colour }" />
        <span class="legend-label">{{ s.label }}</span>
        <span class="legend-amount">{{ s.value > 0 ? formatUgx(s.value) : '' }}</span>
        <span class="legend-value">{{ percent(s.value) }}%</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
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
}

.donut::after {
  content: '';
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: var(--color-surface);
}

.donut-centre {
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
  font-size: 1.125rem;
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
  margin: 0;
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

.legend-amount {
  color: var(--color-ink-soft);
}

.legend-value {
  min-width: 2.5rem;
  color: var(--color-ink-faint);
  text-align: right;
}
</style>
