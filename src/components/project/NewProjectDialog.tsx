import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface Props {
  onClose: () => void
  onConfirm: (name: string, dirPath: string) => void
}

export function NewProjectDialog({ onClose, onConfirm }: Props): JSX.Element {
  const [name, setName] = useState('')
  const [dirPath, setDirPath] = useState('')

  async function pickFolder(): Promise<void> {
    const picked = await ipc.pickFolder()
    if (picked) setDirPath(picked)
  }

  function handleConfirm(): void {
    if (!name.trim() || !dirPath.trim()) return
    onConfirm(name.trim(), dirPath.trim())
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Buat Project Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nama Project</label>
            <Input
              placeholder="My API Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Folder Penyimpanan</label>
            <div className="flex gap-2">
              <Input
                className="flex-1 font-mono text-xs"
                placeholder="Pilih folder..."
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={pickFolder}>
                <FolderOpen size={14} />
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Project akan disimpan sebagai folder di lokasi ini.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleConfirm}
            disabled={!name.trim() || !dirPath.trim()}
          >
            Buat Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
