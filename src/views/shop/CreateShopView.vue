<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore } from '@/stores/shop'
import { ApiError } from '@/stores/auth'

const BUSINESS_TYPES = [
  { value: 'small_shop', label: 'Small retail shop / mini-mart' },
  { value: 'hardware', label: 'Hardware shop' },
  { value: 'boutique', label: 'Boutique / clothing store' },
  { value: 'electronics', label: 'Electronics / phone accessories' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'supermarket', label: 'Mini-supermarket / supermarket' },
]

const router = useRouter()
const shopStore = useShopStore()

const name = ref('')
const businessType = ref('')
const phone = ref('')
const address = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await shopStore.createShop({
      name: name.value,
      business_type: businessType.value,
      phone: phone.value || undefined,
      address: address.value || undefined,
    })
    await router.push('/')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="setup-page">
    <form class="setup-form" @submit.prevent="onSubmit">
      <h1>Set up your shop</h1>
      <p v-if="error" class="error">{{ error }}</p>

      <label for="name">Shop name</label>
      <input id="name" v-model="name" type="text" required />

      <label for="business_type">Business type</label>
      <select id="business_type" v-model="businessType" required>
        <option value="" disabled>Choose one</option>
        <option v-for="type in BUSINESS_TYPES" :key="type.value" :value="type.value">
          {{ type.label }}
        </option>
      </select>

      <label for="phone">Phone (optional)</label>
      <input id="phone" v-model="phone" type="tel" />

      <label for="address">Address (optional)</label>
      <input id="address" v-model="address" type="text" />

      <button type="submit" :disabled="loading">{{ loading ? 'Creating…' : 'Create shop' }}</button>
    </form>
  </main>
</template>

<style scoped>
.setup-page {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}
.setup-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 400px;
}
label {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
input,
select {
  padding: 0.5rem;
  font-size: 1rem;
}
button {
  margin-top: 1rem;
  padding: 0.6rem;
  font-size: 1rem;
  cursor: pointer;
}
.error {
  color: #c0392b;
}
</style>
