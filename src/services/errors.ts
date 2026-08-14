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

export class UnexpectedResponseError extends Error {
  constructor(context: string) {
    super(`[Conduit API] ${context} returned an empty or malformed response`)
    this.name = 'UnexpectedResponseError'
  }
}

export class ValidationError extends Error {
  readonly errors: ApiErrors

  constructor(message: string, errors: ApiErrors) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
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

export function toApiErrors(error: unknown): ApiErrors {
  if (error instanceof ValidationError) {
    return Object.fromEntries(
      Object.entries(error.errors).map(([field, messages]) => [
        field,
        [...messages],
      ]),
    )
  }

  if (error instanceof ApiError && isApiErrorPayload(error.data)) {
    return Object.fromEntries(
      Object.entries(error.data.errors).map(([field, messages]) => [
        field,
        [...messages],
      ]),
    )
  }

  if (error instanceof ConnectivityError) {
    return { network: ['is unavailable; check the API address and try again'] }
  }

  if (error instanceof UnexpectedResponseError) {
    return { server: ['returned an invalid response'] }
  }

  return { server: ['failed unexpectedly'] }
}
