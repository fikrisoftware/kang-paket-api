import { useState } from 'react'
import { Download } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useProjectStore } from '../../store/projectStore'

interface Props {
  onClose: () => void
}

const FORMATS = [
  { id: 'postman', label: 'Postman Collection v2.1', ext: '.json' },
  { id: 'openapi-json', label: 'OpenAPI 3.0 (JSON)', ext: '.json' },
  { id: 'openapi-yaml', label: 'OpenAPI 3.0 (YAML)', ext: '.yaml' },
  { id: 'insomnia', label: 'Insomnia v4', ext: '.json' },
  { id: 'bruno', label: 'Bruno (.bru)', ext: '.bru' }
]

export function ExportDialog({ onClose }: Props): JSX.Element {
  const [format, setFormat] = useState('postman')
  const [exporting, setExporting] = useState(false)
  const requests = useProjectStore((s) => s.workspace?.requests ?? [])

  async function handleExport(): Promise<void> {
    if (!requests.length) return
    setExporting(true)
    try {
      await ipc.exportCollection(requests, format)
    } finally {
      setExporting(false)
      onClose()
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: 24, width: 380,
          display: 'flex', flexDirection: 'column', gap: 16
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Export Collection</h2>

        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {requests.length} request akan di-export.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Format</label>
          {FORMATS.map((f) => (
            <label
              key={f.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${format === f.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: format === f.id ? 'rgba(16,185,129,0.08)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="format"
                value={f.id}
                checked={format === f.id}
                onChange={() => setFormat(f.id)}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: format === f.id ? 500 : 400 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{f.ext}</div>
              </div>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-muted)'
            }}
          >
            Batal
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !requests.length}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff', border: 'none',
              opacity: exporting || !requests.length ? 0.5 : 1
            }}
          >
            <Download size={13} />
            {exporting ? 'Menyimpan...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
