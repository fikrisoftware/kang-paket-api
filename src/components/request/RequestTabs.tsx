import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { KeyValueTable, type KVRow } from '../common/KeyValueTable'
import type { NyiruRequest, RequestHeader } from '../../types/request'

interface Props {
  request: NyiruRequest
  onUpdate: (patch: Partial<NyiruRequest>) => void
}

type Tab = 'params' | 'headers' | 'body' | 'auth'

const TABS: { id: Tab; label: string }[] = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
  { id: 'auth', label: 'Auth' }
]

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
    transition: 'color 0.15s'
  }
}

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

  return (
    <div className="flex flex-col" style={{ flex: 1, overflow: 'hidden' }}>
      {/* Tab header */}
      <div style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} style={tabStyle(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.id === 'headers' && request.headers.length > 0 && (
              <span className="ml-1 text-[10px] px-1 rounded" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {request.headers.filter((h) => h.enabled).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
        {activeTab === 'params' && (
          <KeyValueTable rows={getParamRows()} onChange={setParamRows} keyPlaceholder="param" valuePlaceholder="value" />
        )}

        {activeTab === 'headers' && (
          <KeyValueTable
            rows={toKVRows(request.headers)}
            onChange={(rows) => onUpdate({ headers: fromKVRows(rows) })}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}

        {activeTab === 'body' && (
          <div className="flex flex-col h-full">
            <div className="flex gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
              {(['none', 'json', 'text', 'form-urlencoded'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ body: { ...request.body, type: t } })}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{
                    background: request.body.type === t ? 'var(--color-accent)' : 'var(--color-border)',
                    color: request.body.type === t ? '#fff' : 'var(--color-text-muted)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {request.body.type === 'none' && (
              <div className="flex items-center justify-center flex-1">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Request ini tidak memiliki body.</p>
              </div>
            )}
            {(request.body.type === 'json' || request.body.type === 'text') && (
              <CodeMirror
                value={request.body.content}
                onChange={(val) => onUpdate({ body: { ...request.body, content: val } })}
                extensions={request.body.type === 'json' ? [json()] : []}
                theme={isDark ? 'dark' : 'light'}
                style={{ flex: 1, fontSize: 12 }}
                basicSetup={{ lineNumbers: true, foldGutter: false }}
              />
            )}
            {request.body.type === 'form-urlencoded' && (
              <KeyValueTable
                rows={(request.body.formData ?? []).map((f) => ({ key: f.key, value: f.value, enabled: f.enabled }))}
                onChange={(rows) => onUpdate({ body: { ...request.body, formData: rows } })}
                keyPlaceholder="field"
                valuePlaceholder="value"
              />
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="p-3 flex flex-col gap-3">
            <div className="flex gap-2">
              {(['none', 'bearer', 'basic', 'api-key'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onUpdate({ auth: { ...request.auth, type: t } })}
                  className="text-xs px-2 py-0.5 rounded transition-colors"
                  style={{
                    background: request.auth.type === t ? 'var(--color-accent)' : 'var(--color-border)',
                    color: request.auth.type === t ? '#fff' : 'var(--color-text-muted)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {request.auth.type === 'bearer' && (
              <input
                className="text-xs px-3 py-2 rounded border w-full font-mono"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                placeholder="Bearer token..."
                value={request.auth.token ?? ''}
                onChange={(e) => onUpdate({ auth: { ...request.auth, token: e.target.value } })}
              />
            )}

            {request.auth.type === 'basic' && (
              <div className="flex flex-col gap-2">
                <input className="text-xs px-3 py-2 rounded border font-mono" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  placeholder="Username" value={request.auth.username ?? ''}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, username: e.target.value } })} />
                <input className="text-xs px-3 py-2 rounded border font-mono" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  type="password" placeholder="Password" value={request.auth.password ?? ''}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, password: e.target.value } })} />
              </div>
            )}

            {request.auth.type === 'api-key' && (
              <div className="flex flex-col gap-2">
                <input className="text-xs px-3 py-2 rounded border font-mono" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  placeholder="Key name (e.g. X-API-Key)" value={request.auth.apiKeyName ?? ''}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyName: e.target.value } })} />
                <input className="text-xs px-3 py-2 rounded border font-mono" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  placeholder="Key value" value={request.auth.apiKeyValue ?? ''}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyValue: e.target.value } })} />
                <select className="text-xs px-3 py-2 rounded border" style={{ background: 'var(--color-surface)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  value={request.auth.apiKeyIn ?? 'header'}
                  onChange={(e) => onUpdate({ auth: { ...request.auth, apiKeyIn: e.target.value as 'header' | 'query' } })}>
                  <option value="header">Add to Header</option>
                  <option value="query">Add to Query Params</option>
                </select>
              </div>
            )}

            {request.auth.type === 'none' && (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Request ini tidak menggunakan autentikasi.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
