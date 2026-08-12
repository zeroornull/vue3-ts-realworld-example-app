import type { Article } from '../src/domain'

export const articleFixture: Article = {
  slug: 'learn-typescript',
  title: 'Learn TypeScript with Vue',
  description: 'A small article used by the exercise.',
  body: 'TypeScript makes boundaries visible.',
  tagList: ['typescript', 'vue'],
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
  favorited: false,
  favoritesCount: 0,
  author: {
    username: 'student',
    bio: null,
    image: null,
    following: false,
  },
}

export const articleInputs: unknown[] = [
  articleFixture,
  { title: 'missing required fields' },
  {
    ...articleFixture,
    tagList: ['vue', 123],
  },
  {
    ...articleFixture,
    author: null,
  },
]
