import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Settings, Plus, Trash2 } from 'lucide-react'
import { useEnvStore } from '../../store/envStore'
import { EnvEditorDialog } from './EnvEditorDialog'

export function EnvSelector(): JSX.Element {
  const { environments, activeEnvName, setActiveEnv, addEnvironment, deleteEnvironment } = useEnvStore()
  const [open, setOpen] = useState(false)
  const [editingEnv, setEditingEnv] = useState<string | null>(null)
  const [showNewInput, setShowNewInput] = useState(false)
  const [newName, setNewName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleAdd(): void {
    const name = newName.trim()
    if (!name || environments.find((e) => e.name === name)) return
    addEnvironment(name)
    setActiveEnv(name)
    setNewName('')
    setShowNewInput(false)
    setEditingEnv(name)
  }

  return (
    <>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 4, fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--color-border)', background: 'var(--color-surface)',
            color: activeEnvName ? 'var(--color-accent)' : 'var(--color-text-muted)',
            minWidth: 120
          }}
        >
          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeEnvName ?? 'No Environment'}
          </span>
          <ChevronDown size={11} />
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 6, minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            {/* No Environment option */}
            <button
              onClick={() => { setActiveEnv(null); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', fontSize: 12, cursor: 'pointer', border: 'none',
                background: activeEnvName === null ? 'var(--color-bg)' : 'transparent',
                color: activeEnvName === null ? 'var(--color-text)' : 'var(--color-text-muted)'
              }}
            >
              No Environment
            </button>

            {environments.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                {environments.map((env) => (
                  <div
                    key={env.name}
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: activeEnvName === env.name ? 'var(--color-bg)' : 'transparent'
                    }}
                  >
                    <button
                      onClick={() => { setActiveEnv(env.name); setOpen(false) }}
                      style={{
                        flex: 1, textAlign: 'left', padding: '8px 12px', fontSize: 12,
                        cursor: 'pointer', border: 'none', background: 'transparent',
                        color: activeEnvName === env.name ? 'var(--color-accent)' : 'var(--color-text)'
                      }}
                    >
                      {env.name}
                    </button>
                    <button
                      onClick={() => { setEditingEnv(env.name); setOpen(false) }}
                      title="Edit variabel"
                      style={{ padding: '8px 6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    >
                      <Settings size={12} />
                    </button>
                    <button
                      onClick={() => deleteEnvironment(env.name)}
                      title="Hapus environment"
                      style={{ padding: '8px 8px 8px 2px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new */}
            <div style={{ borderTop: '1px solid var(--color-border)', padding: 8 }}>
              {showNewInput ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowNewInput(false) }}
                    placeholder="Nama environment"
                    style={{
                      flex: 1, fontSize: 12, padding: '4px 8px', borderRadius: 4,
                      border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                      color: 'var(--color-text)', outline: 'none'
                    }}
                  />
                  <button
                    onClick={handleAdd}
                    style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewInput(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    fontSize: 12, padding: '4px 4px', border: 'none', background: 'transparent',
                    color: 'var(--color-text-muted)', cursor: 'pointer'
                  }}
                >
                  <Plus size={12} /> Tambah Environment
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {editingEnv && (
        <EnvEditorDialog
          envName={editingEnv}
          onClose={() => setEditingEnv(null)}
        />
      )}
    </>
  )
}
