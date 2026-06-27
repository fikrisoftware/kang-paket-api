import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { KeyValueTable, type KVRow } from '../common/KeyValueTable'
import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'
import type { PaketRequest, RequestHeader } from '../../types/request'

interface Props {
  request: PaketRequest
  onUpdate: (patch: Partial<PaketRequest>) => void
}

type Tab = 'params' | 'headers' | 'body' | 'auth'

const TABS: { id: Tab; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' }
]

export function RequestTabs({ request, onUpdate }: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('params')

  function toKVRows(headers: RequestHeader[]): KVRow[] {
    return headers.map((h) => ({ key: h.key, value: h.value, enabled: h.enabled }))
  }

  function fromKVRows(rows: KVRow[]): RequestHeader[] {
    return rows.map((r) => ({ key: r.key, value: r.value, enabled: r.enabled }))
  }

  function getParamRows(): KVRow[] {
    try {
      const urlObj = new URL(request.url.startsWith('http') ? request.url : `http://x/${request.url}`)
      return [...urlObj.searchParams.entries()].map(([key, value]) => ({ key, value, enabled: true }))
    } catch {
      return []
    }
  }

  function setParamRows(rows: KVRow[]): void {
    try {
      const base = request.url.split('?')[0]
      const params = rows.filter((r) => r.key && r.enabled).map((r) => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`).join('&')
      onUpdate({ url: params ? `${base}?${params}` : base })
    } catch {
      // ignore malformed URL
    }
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'

  const enabledHeaderCount = request.headers.filter((h) => h.enabled).length

  return (
    <div className="flex flex-col" style={{ flex: 1, overflow: 'hidden' }}>
      {/* Tab header bar */}
      <div
        className="flex items-end"
        style={{
          height: 42,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          flexShrink: 0,
          paddingLeft: 8
        }}
      >
        {TABS.map((t) => {
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-xs border-b-2 transition-colors cursor-pointer',
                'bg-transparent border-x-0 border-t-0',
                isActive
                  ? 'border-b-[color:var(--color-accent)] font-medium'
                  : 'border-b-transparent hover:opacity-80'
              )}
              style={{
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                lineHeight: 1
              }}
            >
              {t.label}
              {t.id === 'headers' && enabledHeaderCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 h-5 leading-none">
                  {enabledHeaderCount}
                </Badge>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
        {activeTab === 'params' && (
          <div className="flex flex-col h-full">
            <KeyValueTable rows={getParamRows()} onChange={setParamRows} keyPlaceholder="param" valuePlaceholder="value" />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="flex flex-col h-full">
            <KeyValueTable
              rows={toKVRows(request.headers)}
              onChange={(rows) => onUpdate({ headers: fromKVRows(rows) })}
              keyPlaceholder="Header"
              valuePlaceholder="Value"
            />
          </div>
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col h-full">
            {/* Body type selector */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
            >
              {(['none', 'json', 'text', 'form-urlencoded'] as const).map((t) => {
                const isActive = request.body.type === t
                return (
                  <button
                    key={t}
                    onClick={() => onUpdate({ body: { ...request.body, type: t } })}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer border-none',
                      isActive ? 'font-medium' : 'hover:opacity-80'
                    )}
                    style={{
                      background: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isActive ? '#fff' : 'var(--color-text-muted)'
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {request.body.type === 'none' && (
              <div className="flex items-center justify-center flex-1">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Request ini tidak memiliki body.
                </p>
              </div>
            )}
            {(request.body.type === 'json' || request.body.type === 'text') && (
              <div className="flex-1 overflow-auto">
                <CodeMirror
                  value={request.body.content}
                  onChange={(val) => onUpdate({ body: { ...request.body, content: val } })}
                  extensions={request.body.type === 'json' ? [json()] : []}
                  theme={isDark ? 'dark' : 'light'}
                  style={{ flex: 1, fontSize: 12 }}
                  basicSetup={{ lineNumbers: true, foldGutter: false }}
                />
              </div>
            )}
            {request.body.type === 'form-urlencoded' && (
              <div className="flex-1 overflow-auto">
                <KeyValueTable
                  rows={(request.body.formData ?? []).map((f) => ({ key: f.key, value: f.value, enabled: f.enabled }))}
                  onChange={(rows) => onUpdate({ body: { ...request.body, formData: rows } })}
                  keyPlaceholder="field"
                  valuePlaceholder="value"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="p-5 flex flex-col gap-5">
            {/* Auth type selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['none', 'bearer', 'basic', 'api-key'] as const).map((t) => {
                const isActive = request.auth.type === t
                return (
                  <button
                    key={t}
                    onClick={() => onUpdate({ auth: { ...request.auth, type: t } })}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer border-none',
                      isActive ? 'font-medium' : 'hover:opacity-80'
                    )}
                    style={{
                      background: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                      color: isActive ? '#fff' : 'var(--color-text-muted)'
                    }}
                  >
                    {t}
                  </button>
                )
              })}
            </div>

            {request.auth.type === 'bearer' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Token</label>
                <input
                  className="text-sm px-3 py-2.5 rounded-md border w-full font-mono"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                  placeholder="Bearer token..."
                  value={request.auth.token ?? ''}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, token: e.target.value } })}
                />
              </div>
            )}

            {request.auth.type === 'basic' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Username</label>
                  <input
                    className="text-sm px-3 py-2.5 rounded-md border font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                    placeholder="Username"
                    value={request.auth.username ?? ''}
                    onChange={(e) => onUpdate({ auth: { ...request.auth, username: e.target.value } })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Password</label>
                  <input
                    className="text-sm px-3 py-2.5 rounded-md border font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                    type="password"
                    placeholder="Password"
                    value={request.auth.password ?? ''}
                    onChange={(e) => onUpdate({ auth: { ...request.auth, password: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {request.auth.type === 'api-key' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Key name</label>
                  <input
                    className="text-sm px-3 py-2.5 rounded-md border font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                    placeholder="e.g. X-API-Key"
                    value={request.auth.apiKeyName ?? ''}
                    onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyName: e.target.value } })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Key value</label>
                  <input
                    className="text-sm px-3 py-2.5 rounded-md border font-mono"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                    placeholder="Key value"
                    value={request.auth.apiKeyValue ?? ''}
                    onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyValue: e.target.value } })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Add to</label>
                  <select
                    className="text-sm px-3 py-2.5 rounded-md border"
                    style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)', outline: 'none' }}
                    value={request.auth.apiKeyIn ?? 'header'}
                    onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyIn: e.target.value as 'header' | 'query' } })}
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Params</option>
                  </select>
                </div>
              </div>
            )}

            {request.auth.type === 'none' && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Request ini tidak menggunakan autentikasi.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
