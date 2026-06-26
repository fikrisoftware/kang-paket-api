import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useEnvStore } from '../../store/envStore'
import type { EnvVariable } from '../../types/environment'

interface Props {
  envName: string
  onClose: () => void
}

export function EnvEditorDialog({ envName, onClose }: Props): JSX.Element {
  const { environments, setVariables, renameEnvironment } = useEnvStore()
  const env = environments.find((e) => e.name === envName)
  const [rows, setRows] = useState<EnvVariable[]>(env?.variables ?? [])
  const [name, setName] = useState(envName)

  function addRow(): void {
    setRows((r) => [...r, { key: '', value: '', enabled: true }])
  }

  function updateRow(i: number, patch: Partial<EnvVariable>): void {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, ...patch } : row))
  }

  function deleteRow(i: number): void {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }

  function handleSave(): void {
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (trimmedName !== envName) renameEnvironment(envName, trimmedName)
    setVariables(trimmedName, rows.filter((r) => r.key.trim()))
    onClose()
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }
  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg)', color: 'var(--color-text)',
    border: '1px solid var(--color-border)', borderRadius: 4,
    padding: '6px 10px', fontSize: 12, outline: 'none'
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 8, padding: 24, width: 560, display: 'flex', flexDirection: 'column', gap: 16,
          maxHeight: '80vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Nama Environment</label>
            <input
              style={{ ...inputStyle, fontSize: 14, fontWeight: 600 }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Variable table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ width: 28, padding: '4px 6px' }} />
                <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Variable</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Value</th>
                <th style={{ width: 28 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateRow(i, { enabled: e.target.checked })}
                    />
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <input
                      style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
                      placeholder="VARIABLE_NAME"
                      value={row.key}
                      onChange={(e) => updateRow(i, { key: e.target.value })}
                    />
                  </td>
                  <td style={{ padding: '4px 4px' }}>
                    <input
                      style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
                      placeholder="value"
                      value={row.value}
                      onChange={(e) => updateRow(i, { value: e.target.value })}
                    />
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                    <button
                      onClick={() => deleteRow(i)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 2 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addRow}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
              fontSize: 12, padding: '6px 8px', border: 'none', background: 'transparent',
              color: 'var(--color-text-muted)', cursor: 'pointer'
            }}
          >
            <Plus size={12} /> Tambah Variable
          </button>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
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
            onClick={handleSave}
            style={{ padding: '7px 16px', borderRadius: 4, fontSize: 13, cursor: 'pointer', background: 'var(--color-accent)', color: '#fff', border: 'none' }}
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
