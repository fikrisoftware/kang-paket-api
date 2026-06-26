import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { ipc } from '../../lib/ipc'

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

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: 24, width: 400, display: 'flex', flexDirection: 'column', gap: 16
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 4,
    padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none'
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Buat Project Baru</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Nama Project</label>
          <input
            style={inputStyle}
            placeholder="My API Project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Folder Penyimpanan</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', fontSize: 11 }}
              placeholder="Pilih folder..."
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
            />
            <button
              onClick={pickFolder}
              style={{
                padding: '8px 10px', borderRadius: 4, border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', color: 'var(--color-text-muted)', cursor: 'pointer'
              }}
            >
              <FolderOpen size={14} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Project akan disimpan sebagai folder di lokasi ini.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)'
            }}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!name.trim() || !dirPath.trim()}
            style={{
              padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff', border: 'none',
              opacity: (!name.trim() || !dirPath.trim()) ? 0.4 : 1
            }}
          >
            Buat Project
          </button>
        </div>
      </div>
    </div>
  )
}
