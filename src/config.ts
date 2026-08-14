const DEFAULT_API_URL = 'https://api.realworld.show/api'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '')
