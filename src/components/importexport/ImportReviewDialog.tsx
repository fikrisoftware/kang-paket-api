import { useState, useMemo } from 'react'
import { Upload, AlertCircle, CheckCircle2, FolderOpen } from 'lucide-react'
import { MethodBadge } from '../common/MethodBadge'
import type { RequestItem } from '../../types/collection'
import type { Environment } from '../../types/environment'

interface ImportedRequest extends RequestItem {
  isDuplicate: boolean
}

interface Props {
  requests: RequestItem[]
  environments: Environment[]
  existingRequests: RequestItem[]
  hasProject: boolean
  onClose: () => void
  onConfirmTemp: (requests: RequestItem[], environments: Environment[]) => void
  onConfirmSave: (requests: RequestItem[], environments: Environment[], collectionName: string) => Promise<void>
}

function isDuplicate(req: RequestItem, existing: RequestItem[]): boolean {
  return existing.some(
    (e) =>
      e.name.toLowerCase() === req.name.toLowerCase() &&
      e.method === req.method &&
      e.url === req.url
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
}

const dialog: React.CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 10, width: 560, maxHeight: '80vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden'
}

export function ImportReviewDialog({
  requests, environments, existingRequests, hasProject,
  onClose, onConfirmTemp, onConfirmSave
}: Props): JSX.Element {
  const annotated = useMemo<ImportedRequest[]>(
    () => requests.map((r) => ({ ...r, isDuplicate: isDuplicate(r, existingRequests) })),
    [requests, existingRequests]
  )

  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(annotated.filter((r) => !r.isDuplicate).map((r) => r.id))
  )
  const [mode, setMode] = useState<'temp' | 'save'>(hasProject ? 'save' : 'temp')
  const [collectionName, setCollectionName] = useState(
    annotated[0]?.collectionName ?? 'Imported'
  )
  const [saving, setSaving] = useState(false)

  const selected = annotated.filter((r) => checked.has(r.id))
  const dupCount = annotated.filter((r) => r.isDuplicate).length
  const newCount = annotated.filter((r) => !r.isDuplicate).length

  function toggleAll(val: boolean): void {
    setChecked(val ? new Set(annotated.map((r) => r.id)) : new Set())
  }

  function toggle(id: string): void {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleConfirm(): Promise<void> {
    if (!selected.length) return
    if (mode === 'temp') {
      onConfirmTemp(selected, environments)
    } else {
      setSaving(true)
      try {
        await onConfirmSave(selected, environments, collectionName)
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
            Preview Import
          </h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {newCount} request baru
            {dupCount > 0 && <span style={{ color: 'var(--color-accent)', marginLeft: 6 }}>· {dupCount} duplikat</span>}
            {environments.length > 0 && <span style={{ marginLeft: 6 }}>· {environments.length} environment</span>}
          </p>
        </div>

        {/* Request list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Select all row */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 16px', cursor: 'pointer',
            borderBottom: '1px solid var(--color-border)', marginBottom: 4
          }}>
            <input
              type="checkbox"
              checked={checked.size === annotated.length}
              ref={(el) => { if (el) el.indeterminate = checked.size > 0 && checked.size < annotated.length }}
              onChange={(e) => toggleAll(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }}
            />
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', userSelect: 'none' }}>
              Pilih semua ({annotated.length})
            </span>
          </label>

          {annotated.map((req) => (
            <label
              key={req.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '5px 16px', cursor: 'pointer',
                opacity: req.isDuplicate && !checked.has(req.id) ? 0.5 : 1
              }}
            >
              <input
                type="checkbox"
                checked={checked.has(req.id)}
                onChange={() => toggle(req.id)}
                style={{ accentColor: 'var(--color-accent)', width: 14, height: 14, flexShrink: 0 }}
              />
              <MethodBadge method={req.method} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {req.name}
              </span>
              {req.isDuplicate
                ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', flexShrink: 0 }}>
                    DUPLIKAT
                  </span>
                : <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)', flexShrink: 0 }}>
                    BARU
                  </span>
              }
              {req.collectionName && (
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {req.collectionName}
                </span>
              )}
            </label>
          ))}

          {environments.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 8, padding: '10px 16px 4px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Environment ({environments.length})
              </p>
              {environments.map((env) => (
                <div key={env.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <CheckCircle2 size={12} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{env.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>— {env.variables.length} variabel</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Simpan ke
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio" name="mode" value="temp"
                checked={mode === 'temp'}
                onChange={() => setMode('temp')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text)' }}>Buka sementara</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Tidak disimpan ke file — hilang saat tutup app</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: hasProject ? 'pointer' : 'not-allowed', opacity: hasProject ? 1 : 0.4 }}>
              <input
                type="radio" name="mode" value="save"
                checked={mode === 'save'}
                onChange={() => setMode('save')}
                disabled={!hasProject}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text)' }}>Simpan ke project</span>
                  {!hasProject && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>(buka project dulu)</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Disimpan sebagai file .kp.json dalam project</div>
              </div>
            </label>
          </div>

          {mode === 'save' && hasProject && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Nama collection
              </label>
              <input
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nama collection..."
                style={{
                  width: '100%', fontSize: 12, padding: '6px 10px', borderRadius: 5,
                  border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  color: 'var(--color-text)', boxSizing: 'border-box'
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px', borderTop: '1px solid var(--color-border)', flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: 5, fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-muted)'
            }}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected.length || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 5, fontSize: 13, cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff', border: 'none',
              opacity: !selected.length || saving ? 0.5 : 1
            }}
          >
            <Upload size={13} />
            {saving ? 'Menyimpan...' : `Import (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
