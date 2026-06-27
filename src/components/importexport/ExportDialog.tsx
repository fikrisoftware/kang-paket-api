import { useState } from 'react'
import { Upload } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useProjectStore } from '../../store/projectStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'

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

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Export Collection</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {requests.length} request akan di-export.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="space-y-1.5">
              {FORMATS.map((f) => (
                <label
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors"
                  style={{
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
                    <div className="text-sm" style={{ fontWeight: format === f.id ? 500 : 400, color: 'var(--color-text)' }}>
                      {f.label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{f.ext}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button
            onClick={handleExport}
            disabled={exporting || !requests.length}
            className="flex items-center gap-1.5"
          >
            <Upload size={13} />
            {exporting ? 'Menyimpan...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
