import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import yaml from 'js-yaml'
import { v4 as uuidv4 } from 'uuid'
import type { RequestItem } from '../../src/types/collection'
import type { WorkspaceTree } from '../../src/types/project'

function parsePostman(raw: unknown): RequestItem[] {
  const col = raw as { item?: unknown[] }
  const items: RequestItem[] = []
  const walk = (nodes: unknown[]): void => {
    for (const node of nodes as Array<{ name?: string; request?: { method?: string; url?: { raw?: string }; header?: Array<{ key: string; value: string; disabled?: boolean }>; body?: { mode?: string; raw?: string } }; item?: unknown[] }>) {
      if (node.item) { walk(node.item); continue }
      if (!node.request) continue
      const r = node.request
      items.push({
        id: uuidv4(),
        name: node.name ?? 'Untitled',
        method: r.method ?? 'GET',
        url: r.url?.raw ?? '',
        headers: (r.header ?? []).map((h) => ({ key: h.key, value: h.value, enabled: !h.disabled })),
        body: { type: r.body?.mode === 'raw' ? 'json' : 'none', content: r.body?.raw ?? '' },
        auth: { type: 'none' },
        meta: { createdAt: new Date().toISOString() }
      })
    }
  }
  walk(col.item ?? [])
  return items
}

function parseOpenApi(raw: unknown): RequestItem[] {
  const spec = raw as { paths?: Record<string, Record<string, { summary?: string; parameters?: Array<{ in: string; name: string; schema?: { example?: string } }> }>> }
  const items: RequestItem[] = []
  for (const [urlPath, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (['get','post','put','delete','patch','head','options'].includes(method)) {
        const params = (op.parameters ?? []).filter((p) => p.in === 'query')
        const queryString = params.map((p) => `${p.name}=${p.schema?.example ?? ''}`).join('&')
        items.push({
          id: uuidv4(),
          name: op.summary ?? `${method.toUpperCase()} ${urlPath}`,
          method: method.toUpperCase(),
          url: queryString ? `${urlPath}?${queryString}` : urlPath,
          headers: [],
          body: { type: 'none', content: '' },
          auth: { type: 'none' },
          meta: { createdAt: new Date().toISOString() }
        })
      }
    }
  }
  return items
}

function parseInsomnia(raw: unknown): RequestItem[] {
  const exp = raw as { resources?: Array<{ _type?: string; name?: string; method?: string; url?: string; headers?: Array<{ name: string; value: string; disabled?: boolean }>; body?: { mimeType?: string; text?: string } }> }
  return (exp.resources ?? [])
    .filter((r) => r._type === 'request')
    .map((r) => ({
      id: uuidv4(),
      name: r.name ?? 'Untitled',
      method: r.method ?? 'GET',
      url: r.url ?? '',
      headers: (r.headers ?? []).map((h) => ({ key: h.name, value: h.value, enabled: !h.disabled })),
      body: { type: 'json', content: r.body?.text ?? '' },
      auth: { type: 'none' },
      meta: { createdAt: new Date().toISOString() }
    }))
}

function parseBruLine(content: string): RequestItem {
  const lines = content.split('\n')
  let method = 'GET', url = '', name = 'Untitled'
  const headers: RequestItem['headers'] = []
  for (const line of lines) {
    if (line.startsWith('meta {')) name = name
    if (line.trim().startsWith('name:')) name = line.split(':')[1].trim()
    if (line.trim().startsWith('method:')) method = line.split(':')[1].trim().toUpperCase()
    if (line.trim().startsWith('url:')) url = line.split(':').slice(1).join(':').trim()
  }
  return {
    id: uuidv4(), name, method, url,
    headers,
    body: { type: 'none', content: '' },
    auth: { type: 'none' },
    meta: { createdAt: new Date().toISOString() }
  }
}

export function registerImportHandlers(): void {
  ipcMain.handle('import:openAndParse', async (): Promise<WorkspaceTree | null> => {
    const result = await dialog.showOpenDialog({
      filters: [
        { name: 'API Collections', extensions: ['json', 'yaml', 'yml', 'bru'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || !result.filePaths[0]) return null

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = filePath.split('.').pop()?.toLowerCase()

    let requests: RequestItem[] = []

    if (ext === 'bru') {
      requests = [parseBruLine(content)]
    } else {
      const raw = ext === 'yaml' || ext === 'yml'
        ? yaml.load(content)
        : JSON.parse(content)

      const obj = raw as Record<string, unknown>
      if (obj.info && (obj.info as Record<string, unknown>).schema?.toString().includes('postman')) {
        requests = parsePostman(raw)
      } else if (obj.openapi || obj.swagger) {
        requests = parseOpenApi(raw)
      } else if (obj._type === 'export' || obj.resources) {
        requests = parseInsomnia(raw)
      }
    }

    return {
      projectPath: '',
      meta: { name: 'Imported', version: '1', createdAt: new Date().toISOString() },
      requests
    }
  })
}
