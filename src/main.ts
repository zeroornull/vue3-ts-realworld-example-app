import { createApp } from 'vue'
import '../realworld/assets/theme/styles.css'
import './style.scss'
import App from './App.vue'
import { createAppRouter } from './router'
import { installAuthGuard } from './router/auth-guard'
import { useAuthStore } from './stores/auth'
import { createAppPinia } from './stores'
import type { ConduitDebug } from './types/conduit-debug'

const app = createApp(App)
const pinia = createAppPinia()
const router = createAppRouter()
const authStore = useAuthStore(pinia)

const conduitDebug: ConduitDebug = {
  getToken: () => authStore.token,
  getAuthState: () => authStore.status,
  getCurrentUser: () => authStore.currentUser,
}

window.__conduit_debug__ = conduitDebug

authStore.hydrateFromStorage()
installAuthGuard(router, pinia)

app.use(pinia)
app.use(router)

app.mount('#app')
