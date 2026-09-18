import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { ApiError, useAuthStore } from '@/stores/auth'
import { useShopStore } from '@/stores/shop'
import { navGroups } from './nav'
import DashboardView from '../views/DashboardView.vue'

const comingSoonRoutes: RouteRecordRaw[] = navGroups
  .flatMap((group) => group.items)
  .filter((item) => item.to !== '/' && !item.ready)
  .map((item) => ({
    path: item.to,
    name: item.to.slice(1),
    component: () => import('../views/ComingSoonView.vue'),
    meta: { requiresAuth: true, title: item.label, owner: item.owner },
  }))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/setup/shop',
      name: 'setup-shop',
      component: () => import('../views/shop/CreateShopView.vue'),
      meta: { requiresAuth: true, standalone: true },
    },
    {
      path: '/pos',
      name: 'pos',
      component: () => import('../views/pos/PosView.vue'),
      meta: { requiresAuth: true, title: 'Sell' },
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/sales/SalesHistoryView.vue'),
      meta: { requiresAuth: true, title: 'Sales history' },
    },
    {
      path: '/sales/:id',
      name: 'sale-detail',
      component: () => import('../views/sales/SaleDetailView.vue'),
      meta: { requiresAuth: true, title: 'Sale' },
    },
    {
      path: '/sync',
      name: 'sync',
      component: () => import('../views/sync/SyncQueueView.vue'),
      meta: { requiresAuth: true, title: 'Sync' },
    },
    ...comingSoonRoutes,
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const shopStore = useShopStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (!to.meta.requiresAuth) return

  if (!auth.user) {
    try {
      await auth.fetchMe()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        auth.clearSession()
        return { name: 'login' }
      }
      return
    }
  }

  // The current shop is only cached locally, so a fresh browser or device has
  // to resolve it from the account's own shops rather than asking the user to
  // create another one.
  if (!shopStore.currentShop) {
    const existingShop = auth.user?.shop_roles[0]?.shop
    if (existingShop) {
      shopStore.setCurrentShop(existingShop)
    } else if (!to.meta.standalone) {
      return { name: 'setup-shop' }
    }
  }
})

export default router
