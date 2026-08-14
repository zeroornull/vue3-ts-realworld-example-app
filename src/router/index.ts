import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/tag/:tag',
    name: 'tag',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/Register.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/editor',
    name: 'article-edit',
    component: () => import('../views/ArticleEdit.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/article/:slug',
    name: 'article',
    component: () => import('../views/Article.vue'),
    props: true,
  },
  {
    path: '/profile/:username',
    name: 'profile',
    component: () => import('../views/Profile.vue'),
    props: true,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFound.vue'),
  },
]

export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
): Router {
  return createRouter({
    history,
    routes,
    scrollBehavior: () => ({ top: 0 }),
  })
}
