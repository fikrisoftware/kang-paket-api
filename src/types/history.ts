import type { PaketRequest } from './request'

export interface HistoryEntry {
  id: string
  method: string
  url: string
  status: number
  durationMs: number
  timestamp: string
  /** Snapshot request lengkap (headers, params, body, auth) agar bisa dibuka ulang utuh. */
  request?: PaketRequest
}
