import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

function resolveBasePath(value: string | undefined): string {
  const trimmed = value?.trim()

  if (!trimmed || trimmed === '/') {
    return '/'
  }

  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: resolveBasePath(process.env.VITE_BASE_PATH),
  plugins: [vue()],
})
