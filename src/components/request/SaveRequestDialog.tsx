import { useState, useMemo } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface Props {
  defaultName: string
  onClose: () => void
  onConfirm: (name: string, collectionName: string) => void
}

export function SaveRequestDialog({ defaultName, onClose, onConfirm }: Props): JSX.Element {
  const [name, setName] = useState(defaultName)
  const [collection, setCollection] = useState('Default')
  const [newCollection, setNewCollection] = useState('')
  const [mode, setMode] = useState<'existing' | 'new'>('existing')

  // Pilih referensi stabil (array requests), lalu turunkan daftar collection via useMemo.
  // Jangan return Object.keys(...) langsung dari selector — array baru tiap render
  // memicu re-render tak terbatas (layar blank).
  const requests = useProjectStore((s) => s.workspace?.requests)
  const collections = useMemo(() => {
    const set = new Set<string>()
    for (const r of requests ?? []) set.add(r.collectionName ?? 'Default')
    return [...set]
  }, [requests])

  const effectiveCollection = mode === 'new' ? newCollection.trim() : collection

  function handleConfirm(): void {
    if (!name.trim() || !effectiveCollection) return
    onConfirm(name.trim(), effectiveCollection)
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 4,
    padding: '7px 12px', fontSize: 13, width: '100%', outline: 'none'
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Simpan Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nama Request</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Collection</label>

            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
                <input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} />
                Pilih yang ada
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--color-text)' }}>
                <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} />
                Buat baru
              </label>
            </div>

            {mode === 'existing' ? (
              <select
                style={inputStyle}
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
              >
                {collections.length === 0 && <option value="Default">Default</option>}
                {collections.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <Input
                placeholder="Nama collection baru"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim() || !effectiveCollection}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
