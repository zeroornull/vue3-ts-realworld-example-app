import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export function installAuthGuard(router: Router, pinia: Pinia): void {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    if (authStore.status === 'loading') {
      await authStore.restoreSession()
    }

    if (!to.meta.requiresAuth || authStore.status === 'authenticated') {
      return true
    }

    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  })
}
