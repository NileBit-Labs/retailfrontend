<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal card" role="dialog" aria-modal="true" :aria-label="title">
      <header class="modal-head">
        <h2>{{ title }}</h2>
        <button type="button" class="modal-close" aria-label="Close" @click="emit('close')">
          ×
        </button>
      </header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.45);
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.modal-head h2 {
  font-size: 1.0625rem;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-faint);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.modal-close:hover {
  background: var(--color-canvas);
  color: var(--color-ink);
}
</style>
