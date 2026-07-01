import type { RequestHeader, RequestBody, RequestAuth } from './request'

export interface RequestItem {
  id: string
  name: string
  method: string
  url: string
  headers: RequestHeader[]
  body: RequestBody
  auth: RequestAuth
  meta: { createdAt: string }
  filePath?: string
  collectionName?: string
  /** Rantai nama folder/grup dari root ke daun, mis. ["Authorize", "Token"].
   *  Sumber kebenaran untuk tampilan tree bertingkat di sidebar. */
  groupPath?: string[]
}
