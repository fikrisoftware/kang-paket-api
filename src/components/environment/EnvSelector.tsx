import { useState, useRef, useEffect } from 'react'
import { Settings, Plus, Trash2, ChevronDown } from 'lucide-react'
import { useEnvStore } from '../../store/envStore'
import { EnvEditorDialog } from './EnvEditorDialog'
import { cn } from '../../lib/utils'

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
        {/* Trigger button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded cursor-pointer',
            'border transition-colors'
          )}
          style={{
            minWidth: 140,
            width: 180,
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: activeEnvName ? 'var(--color-accent)' : 'var(--color-text-muted)'
          }}
        >
          <span className="flex-1 text-left truncate">
            {activeEnvName ?? 'No Environment'}
          </span>
          <ChevronDown size={11} className="shrink-0 opacity-60" />
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute right-0 z-50 overflow-hidden"
            style={{
              top: 'calc(100% + 4px)',
              minWidth: 200,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
            }}
          >
            {/* No Environment option */}
            <button
              onClick={() => { setActiveEnv(null); setOpen(false) }}
              className={cn(
                'w-full text-left text-[12px] px-3 py-2 cursor-pointer border-none transition-colors',
                activeEnvName === null ? 'font-medium' : 'hover:opacity-80'
              )}
              style={{
                background: activeEnvName === null ? 'var(--color-bg)' : 'transparent',
                color: activeEnvName === null ? 'var(--color-text)' : 'var(--color-text-muted)'
              }}
            >
              No Environment
            </button>

            {/* Environment list */}
            {environments.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)' }}>
                {environments.map((env) => {
                  const isActive = activeEnvName === env.name
                  return (
                    <div
                      key={env.name}
                      className="flex items-center group"
                      style={{
                        background: isActive ? 'var(--color-bg)' : 'transparent'
                      }}
                    >
                      <button
                        onClick={() => { setActiveEnv(env.name); setOpen(false) }}
                        className={cn(
                          'flex-1 text-left text-[12px] px-3 py-2 cursor-pointer border-none bg-transparent',
                          'truncate transition-colors',
                          !isActive && 'hover:opacity-80'
                        )}
                        style={{
                          color: isActive ? 'var(--color-accent)' : 'var(--color-text)'
                        }}
                      >
                        {env.name}
                      </button>
                      <button
                        onClick={() => { setEditingEnv(env.name); setOpen(false) }}
                        title="Edit variabel"
                        className="px-1.5 py-2 border-none bg-transparent cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Settings size={12} />
                      </button>
                      <button
                        onClick={() => deleteEnvironment(env.name)}
                        title="Hapus environment"
                        className="px-2 py-2 border-none bg-transparent cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Separator + Add new */}
            <div style={{ borderTop: '1px solid var(--color-border)', padding: '6px 8px' }}>
              {showNewInput ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') { setShowNewInput(false); setNewName('') }
                    }}
                    placeholder="Nama environment"
                    className="flex-1 text-[12px] px-2 py-1 rounded outline-none"
                    style={{
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)'
                    }}
                  />
                  <button
                    onClick={handleAdd}
                    className="text-[12px] px-2 py-1 rounded border-none cursor-pointer font-medium"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewInput(true)}
                  className="inline-flex items-center gap-1.5 w-full text-[12px] px-1 py-1 border-none bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Plus size={12} />
                  Tambah Environment
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
