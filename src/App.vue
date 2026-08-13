<script setup lang="ts">
import { computed, ref } from 'vue'

type LearningStatus = 'not-started' | 'in-progress' | 'completed'

const learningStatus = ref<LearningStatus>('not-started')

const statusLabels = {
  'not-started': '尚未开始',
  'in-progress': '学习中',
  completed: '已完成',
} satisfies Record<LearningStatus, string>

const actionLabels = {
  'not-started': '开始第一个迭代',
  'in-progress': '完成当前迭代',
  completed: '重新体验状态变化',
} satisfies Record<LearningStatus, string>

const statusLabel = computed(() => statusLabels[learningStatus.value])
const actionLabel = computed(() => actionLabels[learningStatus.value])

function advanceLearning(): void {
  switch (learningStatus.value) {
    case 'not-started':
      learningStatus.value = 'in-progress'
      break
    case 'in-progress':
      learningStatus.value = 'completed'
      break
    case 'completed':
      learningStatus.value = 'not-started'
      break
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="navbar">
      <div class="container navbar-content">
        <a class="navbar-brand" href="/">conduit</a>
        <span class="iteration-label">Iteration 1</span>
      </div>
    </header>

    <main class="home-page">
      <section class="banner">
        <div class="container">
          <p class="eyebrow">Vue 3 · TypeScript · Bun</p>
          <h1>conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </section>

      <section class="container page" aria-labelledby="learning-title">
        <div class="learning-card">
          <div>
            <p class="section-label">学习式迁移</p>
            <h2 id="learning-title">从一个可运行的应用外壳开始</h2>
            <p class="learning-copy">
              这一迭代只练习 Vue 响应式状态、计算属性和模板事件。Router、Pinia
              与 API 会在后续迭代逐步加入。
            </p>
          </div>

          <dl class="status-panel" aria-live="polite">
            <div>
              <dt>当前状态</dt>
              <dd :class="['status-badge', `status-badge--${learningStatus}`]">
                {{ statusLabel }}
              </dd>
            </div>
            <div>
              <dt>本次范围</dt>
              <dd>Vue SFC + TypeScript</dd>
            </div>
          </dl>

          <button class="primary-action" type="button" @click="advanceLearning">
            {{ actionLabel }}
          </button>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container">Iteration 1 · No router, store, or API yet.</div>
    </footer>
  </div>
</template>
