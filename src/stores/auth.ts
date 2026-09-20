import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch, ApiError } from '@/lib/api'
import { useShiftStore } from '@/stores/shift'
import { useShopStore, type Shop } from '@/stores/shop'

export interface Organization {
  id: number
  name: string
  default_currency: string
  timezone: string
}

export interface ShopRole {
  role: string
  shop: Shop
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  organization_id: number | null
  organization: Organization | null
  shop_roles: ShopRole[]
}

interface AuthResponse {
  user: User
  token: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const isAuthenticated = computed(() => token.value !== null)

  const currentRole = computed(() => {
    const shopId = useShopStore().currentShop?.id
    return user.value?.shop_roles.find((r) => r.shop.id === shopId)?.role ?? null
  })
  const canManage = computed(() => currentRole.value === 'owner' || currentRole.value === 'manager')

  function setSession(response: AuthResponse) {
    user.value = response.user
    token.value = response.token
    localStorage.setItem('auth_token', response.token)
  }

  function clearSession() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    useShopStore().clearCurrentShop()
    useShiftStore().reset()
  }

  async function register(payload: {
    name: string
    email: string
    password: string
    organization_name: string
  }) {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    })
    setSession(response)
  }

  async function login(payload: { email: string; password: string }) {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
    })
    setSession(response)
  }

  async function logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      clearSession()
    }
  }

  async function fetchMe() {
    user.value = await apiFetch<User>('/auth/me')
  }

  return {
    user,
    token,
    isAuthenticated,
    currentRole,
    canManage,
    register,
    login,
    logout,
    fetchMe,
    clearSession,
  }
})

export { ApiError }
