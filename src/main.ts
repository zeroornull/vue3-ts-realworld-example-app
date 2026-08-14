import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import { createAppRouter } from './router'
import { useAuthStore } from './stores/auth'
import { createAppPinia } from './stores'

const app = createApp(App)
const pinia = createAppPinia()

app.use(pinia)
app.use(createAppRouter())

useAuthStore(pinia).hydrateFromStorage()

app.mount('#app')
