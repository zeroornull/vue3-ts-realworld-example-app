import type { Profile, ProfileResponse } from '../types/realworld'
import { request } from './api'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.username === 'string' &&
    (typeof value.bio === 'string' || value.bio === null) &&
    (typeof value.image === 'string' || value.image === null) &&
    typeof value.following === 'boolean'
  )
}

export function isProfileResponse(value: unknown): value is ProfileResponse {
  return isRecord(value) && isProfile(value.profile)
}

export function getProfile(
  username: string,
  token: string | null = null,
): Promise<unknown | null> {
  return request<unknown>(`profiles/${encodeURIComponent(username)}`, {
    token,
  })
}

export function followProfile(
  username: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`profiles/${encodeURIComponent(username)}/follow`, {
    method: 'POST',
    token,
  })
}

export function unfollowProfile(
  username: string,
  token: string,
): Promise<unknown | null> {
  return request<unknown>(`profiles/${encodeURIComponent(username)}/follow`, {
    method: 'DELETE',
    token,
  })
}
