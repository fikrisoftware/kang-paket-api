import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { Copy, Download } from 'lucide-react'
import type { PaketResponse } from '../../types/request'

interface Props {
  response: PaketResponse
}

type Tab = 'body' | 'headers'

function statusClass(status: number): string {
  if (status < 300) return 'status-2xx'
  if (status < 400) return 'status-3xx'
  if (status < 500) return 'status-4xx'
  return 'status-5xx'
}

function prettyJson(body: string): string {
  try { return JSON.stringify(JSON.parse(body), null, 2) } catch { return body }
}

function isJson(body: string): boolean {
  try { JSON.parse(body); return true } catch { return false }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function ResponseViewer({ response }: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('body')
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
  const prettyBody = isJson(response.body) ? prettyJson(response.body) : response.body

  function copyBody(): void {
    navigator.clipboard.writeText(prettyBody)
  }

  function downloadBody(): void {
    const ext = isJson(response.body) ? 'json' : 'txt'
    const blob = new Blob([prettyBody], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response.${ext}`
    a.click()
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 12, cursor: 'pointer', border: 'none', background: 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent'
  })

  return (
    <div className="flex flex-col h-full" style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Status bar */}
      <div
        className="flex items-center gap-4 px-3 py-2"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}
      >
        <span className={`text-xs font-bold font-mono ${statusClass(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {response.durationMs} ms
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {formatSize(response.sizeBytes)}
        </span>

        <div className="flex-1" />

        <button onClick={copyBody} title="Copy response" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
          <Copy size={13} />
        </button>
        <button onClick={downloadBody} title="Download response" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
          <Download size={13} />
        </button>

        {/* Tabs */}
        <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 8 }}>
          <button style={tabStyle(activeTab === 'body')} onClick={() => setActiveTab('body')}>Body</button>
          <button style={tabStyle(activeTab === 'headers')} onClick={() => setActiveTab('headers')}>
            Headers
            <span className="ml-1 text-[10px] px-1 rounded" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              {Object.keys(response.headers).length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'body' && (
          <CodeMirror
            value={prettyBody}
            extensions={isJson(response.body) ? [json()] : []}
            theme={isDark ? 'dark' : 'light'}
            editable={false}
            style={{ height: '100%', fontSize: 12 }}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
          />
        )}

        {activeTab === 'headers' && (
          <div className="overflow-y-auto h-full">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--color-text-muted)', width: '40%' }}>Header</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--color-accent)', fontSize: 11 }}>{key}</td>
                    <td className="px-3 py-1.5 font-mono" style={{ color: 'var(--color-text)', fontSize: 11, wordBreak: 'break-all' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
