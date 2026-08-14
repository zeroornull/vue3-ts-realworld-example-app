import type {
  LoginCredentials,
  RegistrationCredentials,
  User,
  UserResponse,
  UserSettings,
} from '../types/realworld'
import { request } from './api'

export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return (
    'email' in value &&
    typeof value.email === 'string' &&
    'token' in value &&
    typeof value.token === 'string' &&
    'username' in value &&
    typeof value.username === 'string' &&
    'bio' in value &&
    (typeof value.bio === 'string' || value.bio === null) &&
    'image' in value &&
    (typeof value.image === 'string' || value.image === null)
  )
}

export function isUserResponse(value: unknown): value is UserResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'user' in value &&
    isUser(value.user)
  )
}

export function loginUser(
  credentials: LoginCredentials,
): Promise<unknown | null> {
  return request<unknown>('users/login', {
    method: 'POST',
    body: { user: credentials },
  })
}

export function registerUser(
  credentials: RegistrationCredentials,
): Promise<unknown | null> {
  return request<unknown>('users', {
    method: 'POST',
    body: { user: credentials },
  })
}

export function getCurrentUser(token: string): Promise<unknown | null> {
  return request<unknown>('user', { token })
}

export function updateCurrentUser(
  settings: UserSettings,
  token: string,
): Promise<unknown | null> {
  return request<unknown>('user', {
    method: 'PUT',
    token,
    body: { user: settings },
  })
}
