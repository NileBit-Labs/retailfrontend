<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BaseModal from '@/components/BaseModal.vue'
import ReceiptView from '@/components/pos/ReceiptView.vue'
import RefundModal from '@/components/pos/RefundModal.vue'
import { apiErrorMessage, apiFetch } from '@/lib/api'
import { formatUgx } from '@/lib/format'
import { useAuthStore } from '@/stores/auth'
import type { Sale } from '@/types/sales'

const route = useRoute()
const auth = useAuthStore()

const sale = ref<Sale | null>(null)
const error = ref('')
const showVoid = ref(false)
const showRefund = ref(false)
const reason = ref('')
const voiding = ref(false)
const voidError = ref('')

async function load() {
  error.value = ''
  try {
    sale.value = await apiFetch<Sale>(`/sales/${route.params.id}`)
  } catch (e) {
    error.value = apiErrorMessage(e)
  }
}

async function confirmVoid() {
  voiding.value = true
  voidError.value = ''
  try {
    sale.value = await apiFetch<Sale>(`/sales/${route.params.id}/void`, {
      method: 'POST',
      body: { reason: reason.value },
    })
    showVoid.value = false
    reason.value = ''
  } catch (e) {
    voidError.value = apiErrorMessage(e)
  } finally {
    voiding.value = false
  }
}

function print() {
  window.print()
}

async function share() {
  if (!sale.value) return
  const text = `${sale.value.shop?.name} — receipt ${sale.value.sale_number}\nTotal: ${formatUgx(sale.value.total)}`
  if (navigator.share) {
    await navigator.share({ title: `Receipt ${sale.value.sale_number}`, text }).catch(() => {})
  } else {
    await navigator.clipboard?.writeText(text)
  }
}

onMounted(load)
</script>

<template>
  <main class="page">
    <RouterLink class="back" to="/sales">← Sales history</RouterLink>

    <p v-if="error" class="alert-danger">{{ error }}</p>
    <p v-else-if="!sale" class="state">Loading…</p>

    <template v-else>
      <div class="receipt-print">
        <ReceiptView :sale="sale" />
      </div>

      <div class="actions">
        <button type="button" class="btn" @click="print">Print</button>
        <button type="button" class="btn" @click="share">Share</button>
        <button
          v-if="auth.canManage && sale.status === 'completed'"
          type="button"
          class="btn"
          @click="showRefund = true"
        >
          Refund
        </button>
        <button
          v-if="auth.canManage && sale.status === 'completed' && !sale.refunds?.length"
          type="button"
          class="btn danger"
          @click="showVoid = true"
        >
          Void sale
        </button>
      </div>
    </template>

    <RefundModal
      v-if="showRefund && sale"
      :sale="sale"
      @close="showRefund = false"
      @done="
        () => {
          showRefund = false
          load()
        }
      "
    />

    <BaseModal v-if="showVoid && sale" title="Void this sale?" @close="showVoid = false">
      <p class="void-note">
        This returns the items to stock and reverses the payments. The sale stays in the records as
        voided and this is written to the audit log.
      </p>

      <p v-if="voidError" class="alert-danger">{{ voidError }}</p>

      <div class="field">
        <label for="reason">Reason</label>
        <input
          id="reason"
          v-model="reason"
          type="text"
          maxlength="255"
          placeholder="e.g. Wrong item"
        />
      </div>

      <div class="modal-actions">
        <button type="button" class="btn" @click="showVoid = false">Keep sale</button>
        <button
          type="button"
          class="btn danger-solid"
          :disabled="reason.trim().length < 3 || voiding"
          @click="confirmVoid"
        >
          {{ voiding ? 'Voiding…' : 'Void sale' }}
        </button>
      </div>
    </BaseModal>
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.back {
  color: var(--color-ink-soft);
  font-size: 0.875rem;
  text-decoration: none;
}

.back:hover {
  color: var(--color-primary);
}

.state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-ink-faint);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.actions .btn,
.modal-actions .btn {
  border-color: var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-ink);
}

.actions .danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.void-note {
  margin-bottom: 1rem;
  color: var(--color-ink-soft);
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.modal-actions .danger-solid {
  border-color: transparent;
  background: var(--color-danger);
  color: var(--color-on-danger);
}
</style>
