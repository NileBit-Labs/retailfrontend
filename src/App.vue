<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function onLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <header v-if="auth.isAuthenticated" class="topbar">
    <RouterLink to="/" class="brand">
      <span class="brand-mark">N</span>
      <span class="brand-name">NileBit<span class="brand-name-accent">Retail</span></span>
    </RouterLink>

    <nav class="topbar-nav">
      <span v-if="auth.user" class="user-name">{{ auth.user.name }}</span>
      <button class="btn-link" @click="onLogout">Log out</button>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.brand-name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-ink);
  letter-spacing: -0.01em;
}

.brand-name-accent {
  color: var(--color-primary);
  font-weight: 500;
}

.topbar-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-size: 0.875rem;
  color: var(--color-ink-soft);
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-soft);
  cursor: pointer;
}

.btn-link:hover {
  color: var(--color-primary);
}
</style>
