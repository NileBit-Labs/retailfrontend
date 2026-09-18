<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navGroups } from '@/router/nav'
import NavIcon from '@/components/NavIcon.vue'
import SyncStatus from '@/components/SyncStatus.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useSyncStore } from '@/stores/sync'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const sync = useSyncStore()
const showShell = computed(() => auth.isAuthenticated && !route.meta.standalone)

watch(
  () => auth.isAuthenticated,
  (signedIn) => {
    if (signedIn) void sync.init()
  },
  { immediate: true },
)

async function onLogout() {
  if (
    sync.unsyncedCount &&
    !window.confirm(
      `${sync.unsyncedCount} sale${sync.unsyncedCount === 1 ? ' is' : 's are'} not synced yet. They stay safe on this device, but will only reach the shop's records after you sign in and sync again. Log out anyway?`,
    )
  ) {
    return
  }
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div v-if="showShell" class="shell">
    <div v-if="sidebarOpen" class="scrim" @click="sidebarOpen = false" />

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <RouterLink to="/" class="brand" @click="sidebarOpen = false">
        <span class="brand-mark">N</span>
        <span class="brand-name">NileBit<span class="brand-name-accent">Retail</span></span>
      </RouterLink>

      <nav class="nav">
        <div v-for="group in navGroups" :key="group.label" class="nav-group">
          <p class="nav-group-label">{{ group.label }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            @click="sidebarOpen = false"
          >
            <NavIcon :name="item.icon" />
            {{ item.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <SyncStatus />
        <ThemeToggle />
        <div class="user-block">
          <span class="user-name">{{ auth.user?.name }}</span>
          <button class="btn-link" @click="onLogout">Log out</button>
        </div>
      </div>
    </aside>

    <div class="content-area">
      <header class="mobile-topbar">
        <button class="hamburger" aria-label="Open menu" @click="sidebarOpen = true">
          <span /><span /><span />
        </button>
        <span class="mobile-title">{{ (route.meta.title as string) ?? 'Dashboard' }}</span>
        <SyncStatus class="mobile-sync" />
      </header>

      <RouterView />
    </div>
  </div>

  <RouterView v-else />
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100%;
  width: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
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

.sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem 0.75rem;
}

.nav-group {
  margin-bottom: 1rem;
}

.nav-group-label {
  padding: 0 0.625rem;
  margin-bottom: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-soft);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--color-canvas);
  color: var(--color-ink);
}

.nav-item.router-link-exact-active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 0.875rem 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.user-block {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.user-name {
  font-size: 0.8125rem;
  color: var(--color-ink-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-link {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink-faint);
  cursor: pointer;
}

.btn-link:hover {
  color: var(--color-primary);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mobile-topbar {
  display: none;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.mobile-title {
  font-weight: 600;
  font-size: 0.9375rem;
}

.mobile-sync {
  margin-left: auto;
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 20px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.hamburger span {
  height: 2px;
  border-radius: 1px;
  background: var(--color-ink);
}

.scrim {
  display: none;
}

@media (max-width: 860px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    box-shadow: var(--shadow-card);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 20;
  }

  .mobile-topbar {
    display: flex;
  }
}
</style>
