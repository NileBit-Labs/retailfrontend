import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { navGroups } from './nav'
import DashboardView from '../views/DashboardView.vue'

const comingSoonRoutes: RouteRecordRaw[] = navGroups
  .flatMap((group) => group.items)
  .filter((item) => item.to !== '/')
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
    ...comingSoonRoutes,
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
