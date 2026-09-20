<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  points: { label: string; value: number; title: string; highlight?: boolean }[]
  emptyText: string
  height?: number
}>()

const max = computed(() => Math.max(...props.points.map((p) => p.value), 0))
const isEmpty = computed(() => max.value <= 0)

// 1.2M, 45K - short enough to sit above a narrow bar.
function compact(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`
  return String(n)
}
</script>

<template>
  <div class="bar-chart" :style="{ height: (height ?? 260) + 'px' }">
    <div class="gridlines" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="gridline" />
    </div>
    <div class="bars" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }">
      <div v-for="p in points" :key="p.label" class="bar-col" :title="p.title">
        <span class="bar-value">{{ p.value > 0 ? compact(p.value) : '' }}</span>
        <div
          class="bar"
          :class="{ highlight: p.highlight }"
          :style="{
            height: isEmpty || p.value <= 0 ? '3px' : `${Math.max((p.value / max) * 100, 2)}%`,
          }"
        />
        <span class="bar-label">{{ p.label }}</span>
      </div>
    </div>
    <p v-if="isEmpty" class="chart-empty">{{ emptyText }}</p>
  </div>
</template>

<style scoped>
.bar-chart {
  position: relative;
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
  gap: 0.5rem;
  align-items: stretch;
  padding: 0 0.25rem;
  min-height: 0;
}

.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  min-width: 0;
}

.bar-value {
  height: 1rem;
  font-size: 0.6875rem;
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.bar {
  width: 100%;
  max-width: 44px;
  border-radius: 3px 3px 0 0;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary);
  border-bottom: none;
  transition: height 0.3s;
}

.bar.highlight {
  background: var(--color-primary);
}

.bar-label {
  height: 1.5rem;
  padding-top: 0.25rem;
  overflow: hidden;
  font-size: 0.75rem;
  color: var(--color-ink-faint);
  white-space: nowrap;
}

.chart-empty {
  position: absolute;
  inset: 0 0 1.75rem 0;
  display: grid;
  place-items: center;
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--color-ink-faint);
  text-align: center;
  pointer-events: none;
}
</style>
