import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'

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

  const collections = useProjectStore((s) => Object.keys(s.getCollections()))

  const effectiveCollection = mode === 'new' ? newCollection.trim() : collection

  function handleConfirm(): void {
    if (!name.trim() || !effectiveCollection) return
    onConfirm(name.trim(), effectiveCollection)
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }
  const cardStyle: React.CSSProperties = {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 8, padding: 24, width: 380, display: 'flex', flexDirection: 'column', gap: 16
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 4,
    padding: '7px 12px', fontSize: 13, width: '100%', outline: 'none'
  }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: 'var(--color-text-muted)' }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Simpan Request</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Nama Request</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle}>Collection</label>

          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} />
              Pilih yang ada
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} />
              Buat baru
            </label>
          </div>

          {mode === 'existing' ? (
            <select
              style={{ ...inputStyle }}
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              {collections.length === 0 && <option value="Default">Default</option>}
              {collections.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              style={inputStyle}
              placeholder="Nama collection baru"
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
            disabled={!name.trim() || !effectiveCollection}
            style={{
              padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
              background: 'var(--color-accent)', color: '#fff', border: 'none',
              opacity: (!name.trim() || !effectiveCollection) ? 0.4 : 1
            }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
