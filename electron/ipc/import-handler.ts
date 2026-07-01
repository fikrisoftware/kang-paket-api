import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import yaml from 'js-yaml'
import { v4 as uuidv4 } from 'uuid'
import type { RequestItem } from '../../src/types/collection'
import type { WorkspaceTree } from '../../src/types/project'
import type { RequestAuth, RequestBody } from '../../src/types/request'
import type { Environment } from '../../src/types/environment'

// ─── Postman ─────────────────────────────────────────────────────────────────

type PostmanUrl = string | {
  raw?: string
  query?: Array<{ key: string; value?: string; disabled?: boolean }>
}

type PostmanAuth = {
  type?: string
  bearer?: Array<{ key: string; value: string }>
  basic?: Array<{ key: string; value: string }>
  apikey?: Array<{ key: string; value: string }>
}

type PostmanBody = {
  mode?: string
  raw?: string
  options?: { raw?: { language?: string } }
  urlencoded?: Array<{ key: string; value?: string; disabled?: boolean }>
  formdata?: Array<{ key: string; value?: string; disabled?: boolean; type?: string }>
}

type PostmanRequest = {
  method?: string
  url?: PostmanUrl
  header?: Array<{ key: string; value: string; disabled?: boolean }>
  body?: PostmanBody
  auth?: PostmanAuth
}

type PostmanNode = {
  name?: string
  request?: PostmanRequest
  item?: PostmanNode[]
}

function parsePostmanUrl(url: PostmanUrl): { raw: string; queryParams: RequestItem['headers'] } {
  if (typeof url === 'string') return { raw: url, queryParams: [] }
  const queryParams = (url.query ?? [])
    .filter((q) => q.key)
    .map((q) => ({ key: q.key, value: q.value ?? '', enabled: !q.disabled }))
  return { raw: url.raw ?? '', queryParams }
}

function parsePostmanAuth(auth?: PostmanAuth): RequestAuth {
  if (!auth) return { type: 'none' }
  const find = (arr: Array<{ key: string; value: string }> | undefined, key: string) =>
    arr?.find((e) => e.key === key)?.value ?? ''

  switch (auth.type) {
    case 'bearer':
      return { type: 'bearer', token: find(auth.bearer, 'token') }
    case 'basic':
      return {
        type: 'basic',
        username: find(auth.basic, 'username'),
        password: find(auth.basic, 'password')
      }
    case 'apikey': {
      const name = find(auth.apikey, 'key')
      const value = find(auth.apikey, 'value')
      const inField = find(auth.apikey, 'in') as 'header' | 'query' | ''
      return {
        type: 'api-key',
        apiKeyName: name,
        apiKeyValue: value,
        apiKeyIn: inField === 'query' ? 'query' : 'header'
      }
    }
    default:
      return { type: 'none' }
  }
}

function parsePostmanBody(body?: PostmanBody): RequestBody {
  if (!body || body.mode === 'none' || !body.mode) return { type: 'none', content: '' }
  if (body.mode === 'raw') {
    const lang = body.options?.raw?.language?.toLowerCase() ?? ''
    const type = lang === 'json' ? 'json' : 'text'
    return { type, content: body.raw ?? '' }
  }
  if (body.mode === 'urlencoded') {
    const formData = (body.urlencoded ?? []).map((f) => ({
      key: f.key,
      value: f.value ?? '',
      enabled: !f.disabled
    }))
    return { type: 'form-urlencoded', content: '', formData }
  }
  if (body.mode === 'formdata') {
    const formData = (body.formdata ?? [])
      .filter((f) => f.type !== 'file')
      .map((f) => ({ key: f.key, value: f.value ?? '', enabled: !f.disabled }))
    return { type: 'form-urlencoded', content: '', formData }
  }
  return { type: 'none', content: '' }
}

function parsePostman(raw: unknown): RequestItem[] {
  const col = raw as { item?: PostmanNode[]; auth?: PostmanAuth }
  const collectionAuth = col.auth
  const items: RequestItem[] = []

  const walk = (nodes: PostmanNode[], path: string[]): void => {
    for (const node of nodes) {
      if (node.item) { walk(node.item, [...path, node.name ?? 'Untitled']); continue }
      if (!node.request) continue
      const r = node.request
      const { raw: urlRaw, queryParams } = parsePostmanUrl(r.url ?? '')

      // Strip query string from URL (params are tracked separately via queryParams)
      const urlBase = urlRaw.split('?')[0]
      const urlWithParams = queryParams.length
        ? `${urlBase}?${queryParams.filter(q => q.enabled).map(q => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&')}`
        : urlRaw

      items.push({
        id: uuidv4(),
        name: node.name ?? 'Untitled',
        method: r.method ?? 'GET',
        url: urlWithParams,
        headers: (r.header ?? [])
          .filter((h) => h.key)
          .map((h) => ({ key: h.key, value: h.value, enabled: !h.disabled })),
        body: parsePostmanBody(r.body),
        auth: parsePostmanAuth(r.auth ?? collectionAuth),
        collectionName: path[0],
        groupPath: path.length ? path : undefined,
        meta: { createdAt: new Date().toISOString() }
      })
    }
  }

  walk(col.item ?? [], [])
  return items
}

// ─── OpenAPI ──────────────────────────────────────────────────────────────────

type OApiParameter = {
  in: string
  name: string
  required?: boolean
  schema?: { type?: string; example?: unknown }
  example?: unknown
}

type OApiOperation = {
  summary?: string
  operationId?: string
  parameters?: OApiParameter[]
  requestBody?: {
    content?: Record<string, { schema?: unknown; example?: unknown }>
  }
  security?: Array<Record<string, unknown>>
}

function parseOpenApi(raw: unknown): RequestItem[] {
  const spec = raw as {
    paths?: Record<string, Record<string, OApiOperation>>
    servers?: Array<{ url: string }>
    components?: { securitySchemes?: Record<string, { type?: string; scheme?: string; in?: string; name?: string }> }
  }
  const baseUrl = spec.servers?.[0]?.url ?? ''
  const items: RequestItem[] = []
  const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options']

  for (const [urlPath, methods] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method)) continue

      const queryParams = (op.parameters ?? []).filter((p) => p.in === 'query')
      const headerParams = (op.parameters ?? []).filter((p) => p.in === 'header')

      const exampleVal = (p: OApiParameter): string => {
        const ex = p.example ?? p.schema?.example
        return ex !== undefined ? String(ex) : ''
      }

      const queryString = queryParams
        .map((p) => `${p.name}=${exampleVal(p)}`)
        .join('&')

      const headers = headerParams.map((p) => ({
        key: p.name,
        value: exampleVal(p),
        enabled: true
      }))

      // Parse request body
      let body: RequestBody = { type: 'none', content: '' }
      const reqBody = op.requestBody?.content
      if (reqBody) {
        if (reqBody['application/json']) {
          const ex = reqBody['application/json'].example
          body = { type: 'json', content: ex ? JSON.stringify(ex, null, 2) : '' }
        } else if (reqBody['application/x-www-form-urlencoded']) {
          body = { type: 'form-urlencoded', content: '', formData: [] }
        }
      }

      items.push({
        id: uuidv4(),
        name: op.summary ?? op.operationId ?? `${method.toUpperCase()} ${urlPath}`,
        method: method.toUpperCase(),
        url: `${baseUrl}${urlPath}${queryString ? `?${queryString}` : ''}`,
        headers,
        body,
        auth: { type: 'none' },
        meta: { createdAt: new Date().toISOString() }
      })
    }
  }
  return items
}

// ─── Insomnia ─────────────────────────────────────────────────────────────────

type InsomniaResource = {
  _type?: string
  _id?: string
  parentId?: string
  name?: string
  method?: string
  url?: string
  headers?: Array<{ name: string; value: string; disabled?: boolean }>
  body?: { mimeType?: string; text?: string; params?: Array<{ name: string; value: string; disabled?: boolean }> }
  authentication?: {
    type?: string
    token?: string
    prefix?: string
    username?: string
    password?: string
    key?: string
    value?: string
    addTo?: string
  }
}

function parseInsomniaAuth(auth?: InsomniaResource['authentication']): RequestAuth {
  if (!auth || auth.type === 'none' || !auth.type) return { type: 'none' }
  if (auth.type === 'bearer') return { type: 'bearer', token: auth.token ?? '' }
  if (auth.type === 'basic') return { type: 'basic', username: auth.username ?? '', password: auth.password ?? '' }
  if (auth.type === 'apikey') return {
    type: 'api-key',
    apiKeyName: auth.key ?? '',
    apiKeyValue: auth.value ?? '',
    apiKeyIn: auth.addTo === 'queryParams' ? 'query' : 'header'
  }
  return { type: 'none' }
}

function parseInsomnia(raw: unknown): RequestItem[] {
  const exp = raw as { resources?: InsomniaResource[] }
  const resources = exp.resources ?? []
  const folders = new Map(
    resources.filter((r) => r._type === 'request_group').map((r) => [r._id, r])
  )

  // Telusuri rantai parentId ke atas untuk membangun path folder (root → daun).
  const buildPath = (parentId?: string): string[] => {
    const path: string[] = []
    let current = parentId
    const guard = new Set<string>()
    while (current && folders.has(current) && !guard.has(current)) {
      guard.add(current)
      const folder = folders.get(current)!
      if (folder.name) path.unshift(folder.name)
      current = folder.parentId
    }
    return path
  }

  return resources
    .filter((r) => r._type === 'request')
    .map((r) => {
      const mime = r.body?.mimeType ?? ''
      let body: RequestBody
      if (mime.includes('json')) {
        body = { type: 'json', content: r.body?.text ?? '' }
      } else if (mime.includes('urlencoded')) {
        body = {
          type: 'form-urlencoded',
          content: '',
          formData: (r.body?.params ?? []).map((p) => ({ key: p.name, value: p.value, enabled: !p.disabled }))
        }
      } else if (r.body?.text) {
        body = { type: 'text', content: r.body.text }
      } else {
        body = { type: 'none', content: '' }
      }

      return {
        id: uuidv4(),
        name: r.name ?? 'Untitled',
        method: r.method ?? 'GET',
        url: r.url ?? '',
        headers: (r.headers ?? []).map((h) => ({ key: h.name, value: h.value, enabled: !h.disabled })),
        body,
        auth: parseInsomniaAuth(r.authentication),
        collectionName: buildPath(r.parentId)[0],
        groupPath: buildPath(r.parentId).length ? buildPath(r.parentId) : undefined,
        meta: { createdAt: new Date().toISOString() }
      }
    })
}

// ─── Bruno ────────────────────────────────────────────────────────────────────

function parseBru(content: string): RequestItem {
  const lines = content.split('\n')
  let method = 'GET', url = '', name = 'Untitled'
  const headers: RequestItem['headers'] = []
  const formData: Array<{ key: string; value: string; enabled: boolean }> = []
  let bodyContent = ''
  let bodyType: RequestBody['type'] = 'none'
  let auth: RequestAuth = { type: 'none' }

  let section = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('meta {')) { section = 'meta'; continue }
    if (trimmed.startsWith('get {') || trimmed.startsWith('post {') || trimmed.startsWith('put {') ||
        trimmed.startsWith('delete {') || trimmed.startsWith('patch {')) {
      method = trimmed.split(' ')[0].toUpperCase(); section = 'http'; continue
    }
    if (trimmed.startsWith('headers {')) { section = 'headers'; continue }
    if (trimmed.startsWith('body:json {')) { section = 'body-json'; bodyType = 'json'; continue }
    if (trimmed.startsWith('body:text {')) { section = 'body-text'; bodyType = 'text'; continue }
    if (trimmed.startsWith('body:form-urlencoded {')) { section = 'body-form'; bodyType = 'form-urlencoded'; continue }
    if (trimmed.startsWith('auth:bearer {')) { section = 'auth-bearer'; auth = { type: 'bearer', token: '' }; continue }
    if (trimmed.startsWith('auth:basic {')) { section = 'auth-basic'; auth = { type: 'basic', username: '', password: '' }; continue }
    if (trimmed === '}') { section = ''; continue }

    if (section === 'meta' && trimmed.startsWith('name:')) name = trimmed.slice(5).trim()
    if (section === 'http' && trimmed.startsWith('url:')) url = trimmed.slice(4).trim()
    if (section === 'headers' && trimmed.includes(':')) {
      const idx = trimmed.indexOf(':')
      headers.push({ key: trimmed.slice(0, idx).trim(), value: trimmed.slice(idx + 1).trim(), enabled: true })
    }
    if ((section === 'body-json' || section === 'body-text') && trimmed) bodyContent += line + '\n'
    if (section === 'body-form' && trimmed.includes(':')) {
      const idx = trimmed.indexOf(':')
      formData.push({ key: trimmed.slice(0, idx).trim(), value: trimmed.slice(idx + 1).trim(), enabled: true })
    }
    if (section === 'auth-bearer' && trimmed.startsWith('token:') && auth.type === 'bearer') {
      auth.token = trimmed.slice(6).trim()
    }
    if (section === 'auth-basic') {
      if (trimmed.startsWith('username:') && auth.type === 'basic') auth.username = trimmed.slice(9).trim()
      if (trimmed.startsWith('password:') && auth.type === 'basic') auth.password = trimmed.slice(9).trim()
    }
  }

  const body: RequestBody = bodyType === 'form-urlencoded'
    ? { type: 'form-urlencoded', content: '', formData }
    : { type: bodyType, content: bodyContent.trim() }

  return { id: uuidv4(), name, method, url, headers, body, auth, meta: { createdAt: new Date().toISOString() } }
}

// ─── Environment parsers ──────────────────────────────────────────────────────

function parsePostmanEnvs(raw: unknown): Environment[] {
  const obj = raw as Record<string, unknown>
  const envs: Environment[] = []

  // Postman environment file: { name, values: [{ key, value, enabled }] }
  if (obj.values && Array.isArray(obj.values)) {
    const name = (obj.name as string) || 'Imported'
    const variables = (obj.values as Array<{ key?: string; value?: string; enabled?: boolean }>)
      .filter((v) => v.key)
      .map((v) => ({ key: v.key!, value: v.value ?? '', enabled: v.enabled !== false }))
    if (variables.length) envs.push({ name, variables })
    return envs
  }

  // Collection-level variables
  const col = obj as { variable?: Array<{ key?: string; value?: unknown }> }
  if (col.variable?.length) {
    const variables = col.variable
      .filter((v) => v.key)
      .map((v) => ({ key: v.key!, value: String(v.value ?? ''), enabled: true }))
    if (variables.length) envs.push({ name: 'Collection Variables', variables })
  }

  return envs
}

function parseInsomniaEnvs(raw: unknown): Environment[] {
  const exp = raw as { resources?: Array<{ _type?: string; name?: string; data?: Record<string, unknown>; dataPropertyOrder?: unknown }> }
  const envs: Environment[] = []

  for (const r of exp.resources ?? []) {
    if (r._type !== 'environment' || !r.data) continue
    const variables = Object.entries(r.data)
      .filter(([key]) => key && !key.startsWith('_'))
      .map(([key, value]) => ({ key, value: String(value ?? ''), enabled: true }))
    if (variables.length) envs.push({ name: r.name ?? 'Imported Environment', variables })
  }

  return envs
}

// ─── IPC handler ─────────────────────────────────────────────────────────────

export function registerImportHandlers(): void {
  ipcMain.handle('import:openAndParse', async (event): Promise<WorkspaceTree | null> => {
    const result = await dialog.showOpenDialog({
      filters: [
        { name: 'API Collections', extensions: ['json', 'yaml', 'yml', 'bru'] }
      ],
      properties: ['openFile']
    })
    event.sender.getOwnerBrowserWindow()?.focus()
    if (result.canceled || !result.filePaths[0]) return null

    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    const ext = filePath.split('.').pop()?.toLowerCase()

    let requests: RequestItem[] = []

    let environments: Environment[] = []

    if (ext === 'bru') {
      requests = [parseBru(content)]
    } else {
      const raw = ext === 'yaml' || ext === 'yml'
        ? yaml.load(content)
        : JSON.parse(content)

      const obj = raw as Record<string, unknown>
      if (obj.info && (obj.info as Record<string, unknown>).schema?.toString().includes('postman')) {
        requests = parsePostman(raw)
        environments = parsePostmanEnvs(raw)
      } else if (obj.openapi || obj.swagger) {
        requests = parseOpenApi(raw)
      } else if (obj._type === 'export' || obj.resources) {
        requests = parseInsomnia(raw)
        environments = parseInsomniaEnvs(raw)
      } else if (obj.name && obj.values) {
        // Standalone Postman environment file
        environments = parsePostmanEnvs(raw)
      }
    }

    return {
      projectPath: '',
      meta: { name: 'Imported', version: '1', createdAt: new Date().toISOString() },
      requests,
      environments
    }
  })
}
