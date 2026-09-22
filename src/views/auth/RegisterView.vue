<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ApiError } from '@/stores/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const organizationName = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      organization_name: organizationName.value,
    })
    await router.push('/setup/shop')
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
      <h1>Create your account</h1>
      <p class="subtitle">Set up your retail business on NileBit POS.</p>

      <form class="auth-form" @submit.prevent="onSubmit">
        <p v-if="error" class="alert-danger">{{ error }}</p>

        <div class="field">
          <label for="name">Your name</label>
          <input id="name" v-model="name" type="text" required autocomplete="name" />
        </div>

        <div class="field">
          <label for="organization_name">Business name</label>
          <input id="organization_name" v-model="organizationName" type="text" required />
        </div>

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
            minlength="8"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
      </form>

      <p class="switch">
        Already have an account?
        <RouterLink class="link" to="/login">Log in</RouterLink>
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
  color: var(--color-on-primary);
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
