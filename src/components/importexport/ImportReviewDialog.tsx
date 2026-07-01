import { useState, useMemo } from 'react'
import { Download, CheckCircle2, FolderOpen, FolderPlus } from 'lucide-react'
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
  onOpenProject: () => Promise<void>
  onNewProject: () => void
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
  onClose, onConfirmTemp, onConfirmSave, onOpenProject, onNewProject
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
  const [openingProject, setOpeningProject] = useState(false)

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

  async function handleOpenProject(): Promise<void> {
    setOpeningProject(true)
    try {
      await onOpenProject()
      setMode('save')
    } finally {
      setOpeningProject(false)
    }
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
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <DialogTitle className="text-base">Preview Import</DialogTitle>
          <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>{annotated.length} request</span>
            {' '}ditemukan
            {dupCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                {dupCount} duplikat
              </span>
            )}
            {environments.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[11px]" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>
                {environments.length} environment
              </span>
            )}
          </p>
        </DialogHeader>

        {/* Request list — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Select all row */}
          <label
            className="flex items-center gap-3 px-6 py-3 cursor-pointer"
            style={{ borderBottom: '1px solid var(--color-border)', background: 'color-mix(in srgb, var(--color-border) 40%, transparent)' }}
          >
            <input
              type="checkbox"
              checked={checked.size === annotated.length}
              ref={(el) => { if (el) el.indeterminate = checked.size > 0 && checked.size < annotated.length }}
              onChange={(e) => toggleAll(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', width: 14, height: 14 }}
            />
            <span className="text-xs font-medium select-none" style={{ color: 'var(--color-text-muted)' }}>
              Pilih semua ({annotated.length})
            </span>
          </label>

          <div className="py-1">
            {annotated.map((req) => (
              <label
                key={req.id}
                className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors hover:bg-[var(--color-border)]/30"
                style={{ opacity: req.isDuplicate && !checked.has(req.id) ? 0.45 : 1 }}
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.collectionName && (
                    <span className="text-[11px] truncate max-w-[80px]" style={{ color: 'var(--color-text-muted)' }}>
                      {req.collectionName}
                    </span>
                  )}
                  {req.isDuplicate
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>DUPLIKAT</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>BARU</span>
                  }
                </div>
              </label>
            ))}
          </div>

          {environments.length > 0 && (
            <div className="mx-6 mb-4 mt-2 p-3 rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-accent)' }}>
                Environment akan diimport
              </p>
              {environments.map((env) => (
                <div key={env.name} className="flex items-center gap-2 py-0.5">
                  <CheckCircle2 size={12} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{env.name}</span>
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>— {env.variables.length} variabel</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Simpan ke
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio" name="mode" value="temp"
                checked={mode === 'temp'}
                onChange={() => setMode('temp')}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Buka sementara</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Tidak disimpan ke file — hilang saat tutup app</div>
              </div>
            </label>

            <label className="flex items-start gap-3" style={{ cursor: hasProject ? 'pointer' : 'default', opacity: hasProject ? 1 : 0.5 }}>
              <input
                type="radio" name="mode" value="save"
                checked={mode === 'save'}
                onChange={() => setMode('save')}
                disabled={!hasProject}
                className="mt-0.5"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Simpan ke project</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Disimpan sebagai file .kp.json dalam folder project</div>
              </div>
            </label>
          </div>

          {/* No project — show open/create buttons */}
          {!hasProject && (
            <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ background: 'color-mix(in srgb, var(--color-border) 60%, transparent)', border: '1px solid var(--color-border)' }}>
              <div className="flex-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada project yang dibuka
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenProject}
                disabled={openingProject}
                className="flex items-center gap-1.5 text-xs h-7"
              >
                <FolderOpen size={12} />
                {openingProject ? 'Membuka...' : 'Buka Project'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onClose(); onNewProject() }}
                className="flex items-center gap-1.5 text-xs h-7"
              >
                <FolderPlus size={12} />
                Buat Baru
              </Button>
            </div>
          )}

          {mode === 'save' && hasProject && (
            <div className="mt-3 space-y-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Nama collection
              </label>
              <Input
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Nama collection..."
                className="text-sm h-9"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline" onClick={onClose} className="h-9">Batal</Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected.length || saving}
            className="flex items-center gap-2 h-9"
          >
            <Download size={14} />
            {saving ? 'Menyimpan...' : `Import ${selected.length} request`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
