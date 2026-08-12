import { expect, test } from 'bun:test'

test('runs in the Bun runtime', () => {
  expect(Bun.version).toMatch(/^1\.\d+\.\d+$/)
})
