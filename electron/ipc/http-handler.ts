import { ipcMain } from 'electron'
import type { PaketRequest, PaketResponse } from '../../src/types/request'

export function registerHttpHandlers(): void {
  ipcMain.handle('http:execute', async (_event, req: PaketRequest): Promise<PaketResponse> => {
    const start = Date.now()

    const headers: Record<string, string> = {}
    for (const h of req.headers.filter((h) => h.enabled)) {
      headers[h.key] = h.value
    }

    let body: BodyInit | undefined
    if (req.body.type === 'json' && req.body.content) {
      body = req.body.content
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    } else if (req.body.type === 'text' && req.body.content) {
      body = req.body.content
    } else if (req.body.type === 'form-urlencoded' && req.body.formData) {
      const params = new URLSearchParams()
      for (const f of req.body.formData.filter((f) => f.enabled)) {
        params.append(f.key, f.value)
      }
      body = params.toString()
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    const response = await fetch(req.url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body
    })

    const durationMs = Date.now() - start
    const responseBody = await response.text()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      durationMs,
      sizeBytes: new TextEncoder().encode(responseBody).length
    }
  })
}
