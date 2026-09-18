<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ApiError } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value })
    await router.push('/')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <form class="auth-form" @submit.prevent="onSubmit">
      <h1>Log in</h1>
      <p v-if="error" class="error">{{ error }}</p>

      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required autocomplete="email" />

      <label for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        autocomplete="current-password"
      />

      <button type="submit" :disabled="loading">{{ loading ? 'Logging in…' : 'Log in' }}</button>

      <p class="switch">
        Don't have an account? <RouterLink to="/register">Create one</RouterLink>
      </p>
    </form>
  </main>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 360px;
}
label {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
input {
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
.switch {
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
