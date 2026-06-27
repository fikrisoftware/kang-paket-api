import { useState, useMemo } from 'react'
import { Upload, CheckCircle2 } from 'lucide-react'
import { MethodBadge } from '../common/MethodBadge'
import type { RequestItem } from '../../types/collection'
import type { Environment } from '../../types/environment'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

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
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <DialogTitle>Preview Import</DialogTitle>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {newCount} request baru
            {dupCount > 0 && <span className="ml-1.5" style={{ color: 'var(--color-accent)' }}>· {dupCount} duplikat</span>}
            {environments.length > 0 && <span className="ml-1.5">· {environments.length} environment</span>}
          </p>
        </DialogHeader>

        {/* Request list — scrollable */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Select all row */}
          <label
            className="flex items-center gap-2.5 px-4 py-1.5 cursor-pointer mb-1"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <input
              type="checkbox"
              checked={checked.size === annotated.length}
              ref={(el) => { if (el) el.indeterminate = checked.size > 0 && checked.size < annotated.length }}
              onChange={(e) => toggleAll(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }}
            />
            <span className="text-xs select-none" style={{ color: 'var(--color-text-muted)' }}>
              Pilih semua ({annotated.length})
            </span>
          </label>

          {annotated.map((req) => (
            <label
              key={req.id}
              className="flex items-center gap-2.5 px-4 py-1.5 cursor-pointer"
              style={{ opacity: req.isDuplicate && !checked.has(req.id) ? 0.5 : 1 }}
            >
              <input
                type="checkbox"
                checked={checked.has(req.id)}
                onChange={() => toggle(req.id)}
                style={{ accentColor: 'var(--color-accent)', width: 14, height: 14, flexShrink: 0 }}
              />
              <MethodBadge method={req.method} />
              <span className="flex-1 text-xs truncate" style={{ color: 'var(--color-text)' }}>
                {req.name}
              </span>
              {req.isDuplicate
                ? <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                    DUPLIKAT
                  </span>
                : <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>
                    BARU
                  </span>
              }
              {req.collectionName && (
                <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {req.collectionName}
                </span>
              )}
            </label>
          ))}

          {environments.length > 0 && (
            <div className="mt-2 pt-2.5 px-4 pb-1" style={{ borderTop: '1px solid var(--color-border)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Environment ({environments.length})
              </p>
              {environments.map((env) => (
                <div key={env.name} className="flex items-center gap-2 py-0.5">
                  <CheckCircle2 size={12} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text)' }}>{env.name}</span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>— {env.variables.length} variabel</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Simpan ke
          </p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio" name="mode" value="temp"
                checked={mode === 'temp'}
                onChange={() => setMode('temp')}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div>
                <div className="text-sm" style={{ color: 'var(--color-text)' }}>Buka sementara</div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Tidak disimpan ke file — hilang saat tutup app</div>
              </div>
            </label>
            <label className="flex items-center gap-2.5" style={{ cursor: hasProject ? 'pointer' : 'not-allowed', opacity: hasProject ? 1 : 0.4 }}>
              <input
                type="radio" name="mode" value="save"
                checked={mode === 'save'}
                onChange={() => setMode('save')}
                disabled={!hasProject}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text)' }}>
                  Simpan ke project
                  {!hasProject && (
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>(buka project dulu)</span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Disimpan sebagai file .kp.json dalam project</div>
              </div>
            </label>
          </div>

          {mode === 'save' && hasProject && (
            <div className="mt-2.5 space-y-1">
              <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Nama collection
              </label>
              <Input
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nama collection..."
                className="text-xs"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected.length || saving}
            className="flex items-center gap-1.5"
          >
            <Upload size={13} />
            {saving ? 'Menyimpan...' : `Import (${selected.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
