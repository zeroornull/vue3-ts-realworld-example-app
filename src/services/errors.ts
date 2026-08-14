import type { ApiErrorPayload, ApiErrors } from '../types/realworld'

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(method: string, url: string, status: number, data: unknown) {
    super(`[Conduit API] ${method} ${url} returned ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class ConnectivityError extends Error {
  readonly originalError: unknown

  constructor(method: string, url: string, originalError: unknown) {
    super(`[Conduit API] ${method} ${url} could not connect`)
    this.name = 'ConnectivityError'
    this.originalError = originalError
  }
}

export function isApiErrors(value: unknown): value is ApiErrors {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (messages) =>
      Array.isArray(messages) &&
      messages.every((message) => typeof message === 'string'),
  )
}

export function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== 'object' || value === null || !('errors' in value)) {
    return false
  }

  return isApiErrors(value.errors)
}
