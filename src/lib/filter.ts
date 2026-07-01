import { JSONPath } from 'jsonpath-plus'

export interface FilterResult {
  ok: boolean
  value?: unknown
  count?: number
  error?: string
}

/** Terapkan ekspresi JSONPath (mis. `$.data[*].email`) ke body JSON. */
export function applyJsonPath(jsonText: string, path: string): FilterResult {
  let data: unknown
  try {
    data = JSON.parse(jsonText)
  } catch {
    return { ok: false, error: 'Body bukan JSON yang valid' }
  }
  if (!path.trim()) return { ok: true, value: data }
  try {
    const result = JSONPath({ path, json: data as object })
    const count = Array.isArray(result) ? result.length : 1
    return { ok: true, value: result, count }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Ekspresi JSONPath tidak valid' }
  }
}
