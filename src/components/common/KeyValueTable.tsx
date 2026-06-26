import { Plus, Trash2 } from 'lucide-react'

export interface KVRow {
  key: string
  value: string
  enabled: boolean
}

interface Props {
  rows: KVRow[]
  onChange: (rows: KVRow[]) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueTable({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }: Props): JSX.Element {
  function update(idx: number, patch: Partial<KVRow>): void {
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function remove(idx: number): void {
    onChange(rows.filter((_, i) => i !== idx))
  }

  function add(): void {
    onChange([...rows, { key: '', value: '', enabled: true }])
  }

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    color: 'var(--color-text)',
    border: 'none',
    outline: 'none',
    fontSize: 12,
    fontFamily: 'monospace',
    width: '100%',
    padding: '4px 8px'
  }

  const cellStyle: React.CSSProperties = {
    borderBottom: '1px solid var(--color-border)',
    borderRight: '1px solid var(--color-border)'
  }

  return (
    <div style={{ fontSize: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ opacity: row.enabled ? 1 : 0.4 }}>
              <td style={{ ...cellStyle, width: 28, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => update(idx, { enabled: e.target.checked })}
                  style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
              </td>
              <td style={cellStyle}>
                <input
                  style={inputStyle}
                  placeholder={keyPlaceholder}
                  value={row.key}
                  onChange={(e) => update(idx, { key: e.target.value })}
                />
              </td>
              <td style={cellStyle}>
                <input
                  style={inputStyle}
                  placeholder={valuePlaceholder}
                  value={row.value}
                  onChange={(e) => update(idx, { value: e.target.value })}
                />
              </td>
              <td style={{ ...cellStyle, width: 28, textAlign: 'center', borderRight: 'none' }}>
                <button
                  onClick={() => remove(idx)}
                  className="hover:text-red-400 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={add}
        className="flex items-center gap-1 px-3 py-2 text-xs hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Plus size={11} /> Add
      </button>
    </div>
  )
}
