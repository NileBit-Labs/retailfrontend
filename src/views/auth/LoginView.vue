<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ApiError } from '@/stores/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

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
    <div class="theme-toggle-corner">
      <ThemeToggle />
    </div>

    <div class="auth-card card">
      <div class="brand-mark">N</div>
      <h1>Log in to NileBit Retail</h1>
      <p class="subtitle">Run your shop from anywhere.</p>

      <form class="auth-form" @submit.prevent="onSubmit">
        <p v-if="error" class="alert-danger">{{ error }}</p>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" />
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="switch">
        Don't have an account?
        <RouterLink class="link" to="/register">Create one</RouterLink>
      </p>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.theme-toggle-corner {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  padding: 2rem;
  text-align: center;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  font-size: 1.125rem;
}

h1 {
  font-size: 1.25rem;
}

.subtitle {
  margin-top: 0.375rem;
  color: var(--color-ink-faint);
  font-size: 0.875rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.75rem;
  text-align: left;
}

.switch {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--color-ink-soft);
}
</style>
