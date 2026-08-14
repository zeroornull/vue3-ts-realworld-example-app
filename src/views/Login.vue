<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { User } from '../types/realworld'

defineOptions({ name: 'LoginView' })

const authStore = useAuthStore()
const router = useRouter()

const demoUser: User = {
  email: 'learner@example.com',
  token: 'local-demo-token',
  username: 'local-learner',
  bio: null,
  image: null,
}

function createLocalSession(): void {
  authStore.setLocalSession(demoUser)
  void router.push({ name: 'home' })
}
</script>

<template>
  <main class="route-page">
    <section class="route-card">
      <p class="route-kicker">/login</p>
      <h1>本地认证练习</h1>
      <p>先用 Pinia 建立本地认证状态；真实登录表单和 API 在下一迭代加入。</p>
      <button
        class="local-session-action"
        type="button"
        @click="createLocalSession"
      >
        创建本地演示会话
      </button>
      <small>这只会写入演示 token，不会向服务器验证账号。</small>
      <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
    </section>
  </main>
</template>
