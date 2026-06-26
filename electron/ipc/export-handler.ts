import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import yaml from 'js-yaml'
import { v4 as uuidv4 } from 'uuid'
import type { RequestItem } from '../../src/types/collection'

function toPostman(requests: RequestItem[]): object {
  return {
    info: {
      name: 'Kang Paket API Export',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _postman_id: uuidv4()
    },
    item: requests.map((r) => ({
      name: r.name,
      request: {
        method: r.method,
        url: { raw: r.url },
        header: r.headers.map((h) => ({ key: h.key, value: h.value, disabled: !h.enabled })),
        body: r.body.type !== 'none' ? { mode: 'raw', raw: r.body.content } : undefined
      }
    }))
  }
}

function toOpenApi(requests: RequestItem[]): object {
  const paths: Record<string, unknown> = {}
  for (const r of requests) {
    const urlPath = r.url.replace(/https?:\/\/[^/]+/, '') || '/'
    if (!paths[urlPath]) paths[urlPath] = {}
    ;(paths[urlPath] as Record<string, unknown>)[r.method.toLowerCase()] = {
      summary: r.name,
      responses: { '200': { description: 'OK' } }
    }
  }
  return { openapi: '3.0.3', info: { title: 'Kang Paket API Export', version: '1.0.0' }, paths }
}

function toInsomnia(requests: RequestItem[]): object {
  return {
    _type: 'export',
    __export_format: 4,
    resources: requests.map((r) => ({
      _id: `req_${r.id}`,
      _type: 'request',
      name: r.name,
      method: r.method,
      url: r.url,
      headers: r.headers.map((h) => ({ name: h.key, value: h.value, disabled: !h.enabled })),
      body: { mimeType: 'application/json', text: r.body.content }
    }))
  }
}

function toBru(req: RequestItem): string {
  const lines = [
    `meta {`, `  name: ${req.name}`, `  type: http`, `  seq: 1`, `}`, ``,
    `${req.method.toLowerCase()} {`, `  url: ${req.url}`, `  body: none`, `  auth: none`, `}`, ``
  ]
  if (req.headers.length) {
    lines.push('headers {')
    for (const h of req.headers.filter((h) => h.enabled)) {
      lines.push(`  ${h.key}: ${h.value}`)
    }
    lines.push('}', '')
  }
  return lines.join('\n')
}

export function registerExportHandlers(): void {
  ipcMain.handle('export:generate', async (_e, requests: RequestItem[], format: string): Promise<void> => {
    const filters: Electron.FileFilter[] = format === 'postman'
      ? [{ name: 'Postman Collection', extensions: ['json'] }]
      : format === 'openapi-json'
      ? [{ name: 'OpenAPI JSON', extensions: ['json'] }]
      : format === 'openapi-yaml'
      ? [{ name: 'OpenAPI YAML', extensions: ['yaml'] }]
      : format === 'insomnia'
      ? [{ name: 'Insomnia Export', extensions: ['json'] }]
      : [{ name: 'Bruno', extensions: ['bru'] }]

    const result = await dialog.showSaveDialog({ filters })
    if (result.canceled || !result.filePath) return

    let content: string
    if (format === 'postman') content = JSON.stringify(toPostman(requests), null, 2)
    else if (format === 'openapi-json') content = JSON.stringify(toOpenApi(requests), null, 2)
    else if (format === 'openapi-yaml') content = yaml.dump(toOpenApi(requests))
    else if (format === 'insomnia') content = JSON.stringify(toInsomnia(requests), null, 2)
    else content = requests.map(toBru).join('\n---\n')

    fs.writeFileSync(result.filePath, content)
  })
}
