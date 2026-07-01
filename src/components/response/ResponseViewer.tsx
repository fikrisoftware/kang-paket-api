import { useState, useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { Copy, Download, Clock, Scale, Filter, X } from 'lucide-react'
import type { PaketResponse } from '../../types/request'
import { applyJsonPath } from '../../lib/filter'
import { toast } from '../../store/toastStore'

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

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function statusHint(status: number): string {
  if (status === 0) return 'Gagal / tidak ada koneksi'
  if (status < 300) return 'Berhasil'
  if (status < 400) return 'Pengalihan (redirect)'
  if (status < 500) return 'Kesalahan klien'
  return 'Kesalahan server'
}

function Metric({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5" style={{ lineHeight: 1 }}>
      <span className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      {children}
    </div>
  )
}

export function ResponseViewer({ response }: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('body')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterPath, setFilterPath] = useState('')
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
  const bodyIsJson = isJson(response.body)
  const prettyBody = bodyIsJson ? prettyJson(response.body) : response.body

  // Hasil filter JSONPath (hanya saat panel filter aktif & ada ekspresi).
  const filter = useMemo(
    () => applyJsonPath(response.body, filterOpen ? filterPath : ''),
    [response.body, filterPath, filterOpen]
  )
  const isFiltering = filterOpen && filterPath.trim().length > 0
  const displayBody = isFiltering && filter.ok
    ? JSON.stringify(filter.value, null, 2)
    : prettyBody

  function copyBody(): void {
    navigator.clipboard.writeText(displayBody)
      .then(() => toast.success('Response disalin ke clipboard'))
      .catch(() => toast.error('Gagal menyalin response'))
  }

  function downloadBody(): void {
    const ext = bodyIsJson ? 'json' : 'txt'
    const blob = new Blob([displayBody], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `response.${ext}`
    a.click()
    toast.success(`Response diunduh sebagai response.${ext}`)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
    borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6
  })

  return (
    <div className="flex flex-col h-full" style={{ borderTop: '1px solid var(--color-border)' }}>
      {/* Status bar */}
      <div
        className="flex items-center gap-6 px-4"
        style={{
          height: 52,
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          flexShrink: 0
        }}
      >
        <Metric label="Status">
          <span
            className={`text-sm font-bold font-mono ${statusClass(response.status)}`}
            title={statusHint(response.status)}
          >
            {response.status || '—'} {response.statusText}
          </span>
        </Metric>

        <Metric label="Waktu">
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
            {formatDuration(response.durationMs)}
          </span>
        </Metric>

        <Metric label="Ukuran">
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            <Scale size={12} style={{ color: 'var(--color-text-muted)' }} />
            {formatSize(response.sizeBytes)}
          </span>
        </Metric>

        <div className="flex-1" />

        {bodyIsJson && (
          <button
            onClick={() => { setActiveTab('body'); setFilterOpen((v) => !v) }}
            title="Filter JSONPath"
            className="flex items-center justify-center w-8 h-8 rounded hover:opacity-70 transition-opacity"
            style={{ color: filterOpen ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
          >
            <Filter size={15} />
          </button>
        )}
        <button onClick={copyBody} title="Copy response" className="flex items-center justify-center w-8 h-8 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
          <Copy size={15} />
        </button>
        <button onClick={downloadBody} title="Download response" className="flex items-center justify-center w-8 h-8 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
          <Download size={15} />
        </button>

        {/* Tabs */}
        <div style={{ borderLeft: '1px solid var(--color-border)', paddingLeft: 12, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
          <button style={tabStyle(activeTab === 'body')} onClick={() => setActiveTab('body')}>Body</button>
          <button style={tabStyle(activeTab === 'headers')} onClick={() => setActiveTab('headers')}>
            Headers
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              {Object.keys(response.headers).length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'body' && (
          <>
            {filterOpen && bodyIsJson && (
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}
              >
                <Filter size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  value={filterPath}
                  onChange={(e) => setFilterPath(e.target.value)}
                  placeholder="JSONPath, mis. $.data[*].email"
                  autoFocus
                  className="flex-1 text-xs font-mono"
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)' }}
                />
                {isFiltering && filter.ok && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>
                    {filter.count} hasil
                  </span>
                )}
                {isFiltering && !filter.ok && (
                  <span className="text-[11px] flex-shrink-0" style={{ color: '#ef4444' }}>
                    {filter.error}
                  </span>
                )}
                {filterPath && (
                  <button onClick={() => setFilterPath('')} title="Bersihkan" className="flex items-center justify-center w-5 h-5 rounded hover:bg-[var(--color-border)] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <CodeMirror
                value={displayBody}
                extensions={bodyIsJson ? [json()] : []}
                theme={isDark ? 'dark' : 'light'}
                editable={false}
                style={{ height: '100%', fontSize: 13 }}
                basicSetup={{ lineNumbers: true, foldGutter: true }}
              />
            </div>
          </>
        )}

        {activeTab === 'headers' && (
          <div className="overflow-y-auto h-full">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', width: '40%' }}>Header</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-accent)' }}>{key}</td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--color-text)', wordBreak: 'break-all' }}>{value}</td>
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
