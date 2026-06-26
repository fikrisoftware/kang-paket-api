import { Send, Loader2 } from 'lucide-react'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981', POST: '#f59e0b', PUT: '#3b82f6',
  DELETE: '#ef4444', PATCH: '#8b5cf6', HEAD: '#6b7280', OPTIONS: '#6b7280'
}

interface Props {
  method: string
  url: string
  isLoading: boolean
  onMethodChange: (m: string) => void
  onUrlChange: (url: string) => void
  onSend: () => void
}

export function UrlBar({ method, url, isLoading, onMethodChange, onUrlChange, onSend }: Props): JSX.Element {
  const color = METHOD_COLORS[method] ?? '#6b7280'

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' && !isLoading) onSend()
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', flexShrink: 0 }}
    >
      {/* Method selector */}
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        className="text-xs font-bold font-mono rounded px-2 py-1.5 border-0 outline-none cursor-pointer"
        style={{ background: color, color: '#fff', minWidth: 88 }}
      >
        {METHODS.map((m) => (
          <option key={m} value={m} style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
            {m}
          </option>
        ))}
      </select>

      {/* URL input */}
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 text-sm px-3 py-1.5 rounded outline-none border"
        style={{
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          borderColor: 'var(--color-border)',
          fontFamily: 'monospace'
        }}
      />

      {/* Send button */}
      <button
        onClick={onSend}
        disabled={isLoading || !url.trim()}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-opacity disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff' }}
      >
        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}
