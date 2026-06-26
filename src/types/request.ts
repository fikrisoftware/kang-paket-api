export interface RequestHeader {
  key: string
  value: string
  enabled: boolean
}

export interface RequestBody {
  type: 'none' | 'json' | 'text' | 'form-urlencoded'
  content: string
  formData?: Array<{ key: string; value: string; enabled: boolean }>
}

export interface RequestAuth {
  type: 'none' | 'bearer' | 'basic' | 'api-key'
  token?: string
  username?: string
  password?: string
  apiKeyName?: string
  apiKeyValue?: string
  apiKeyIn?: 'header' | 'query'
}

export interface KpRequest {
  method: string
  url: string
  headers: RequestHeader[]
  body: RequestBody
  auth: RequestAuth
}

export interface KpResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  durationMs: number
  sizeBytes: number
}
