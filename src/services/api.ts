import { API_URL } from '../config'
import { ApiError, ConnectivityError } from './errors'

type HttpMethod = 'GET' | 'POST' | 'DELETE'

export type RequestOptions = {
  method?: HttpMethod
  token?: string | null
  body?: unknown
}

function createUrl(path: string): string {
  return `${API_URL}/${path.replace(/^\/+/, '')}`
}

async function readJson(response: Response): Promise<unknown | null> {
  if (response.status === 204) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function request<T>(
  path: string,
  { method = 'GET', token, body }: RequestOptions = {},
): Promise<T | null> {
  const url = createUrl(path)
  const headers = new Headers({ Accept: 'application/json' })

  if (token) {
    headers.set('Authorization', `Token ${token}`)
  }

  const init: RequestInit = { method, headers }

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(body)
  }

  let response: Response

  try {
    response = await fetch(url, init)
  } catch (error: unknown) {
    throw new ConnectivityError(method, url, error)
  }

  const data = await readJson(response)

  if (!response.ok) {
    throw new ApiError(method, url, response.status, data)
  }

  return data as T | null
}
