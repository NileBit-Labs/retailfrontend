<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ApiError } from '@/stores/auth'

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
    <form class="auth-form" @submit.prevent="onSubmit">
      <h1>Create your account</h1>
      <p v-if="error" class="error">{{ error }}</p>

      <label for="name">Your name</label>
      <input id="name" v-model="name" type="text" required autocomplete="name" />

      <label for="organization_name">Business name</label>
      <input id="organization_name" v-model="organizationName" type="text" required />

      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required autocomplete="email" />

      <label for="password">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        required
        minlength="8"
        autocomplete="new-password"
      />

      <button type="submit" :disabled="loading">{{ loading ? 'Creating…' : 'Create account' }}</button>

      <p class="switch">
        Already have an account? <RouterLink to="/login">Log in</RouterLink>
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
