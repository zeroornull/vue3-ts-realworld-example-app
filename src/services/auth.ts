import type {
  LoginCredentials,
  RegistrationCredentials,
  UserResponse,
} from '../types/realworld'
import { request } from './api'

export function loginUser(
  credentials: LoginCredentials,
): Promise<UserResponse | null> {
  return request<UserResponse>('users/login', {
    method: 'POST',
    body: { user: credentials },
  })
}

export function registerUser(
  credentials: RegistrationCredentials,
): Promise<UserResponse | null> {
  return request<UserResponse>('users', {
    method: 'POST',
    body: { user: credentials },
  })
}
