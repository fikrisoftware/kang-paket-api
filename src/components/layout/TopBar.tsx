import { useState, useRef, useEffect } from 'react'
import { Palette } from 'lucide-react'
import { useUiStore, THEMES, type Theme } from '../../store/uiStore'
import { useProjectStore } from '../../store/projectStore'
import { EnvSelector } from '../environment/EnvSelector'
import { cn } from '../../lib/utils'

export function TopBar(): JSX.Element {
  const { theme, setTheme } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return (
    <div
      className={cn('flex items-center justify-between px-3')}
      style={{
        height: 40,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion']
      } as React.CSSProperties}
    >
      {/* App name + project */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--color-accent)' }}>
          Kang Paket
        </span>
        {workspace && (
          <>
            <span className="text-xs select-none" style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-xs truncate max-w-[160px]" style={{ color: 'var(--color-text-muted)' }}>
              {workspace.meta.name}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <EnvSelector />

        {/* Theme picker */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            title="Pilih tema"
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded',
              'transition-colors hover:bg-[var(--color-border)]'
            )}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Palette size={14} />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full mt-1.5 z-50 rounded-lg p-2"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                minWidth: 160
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wider px-2 pb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Tema
              </p>
              {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setOpen(false) }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-xs transition-colors',
                    theme === key ? 'font-medium' : 'hover:bg-[var(--color-border)]'
                  )}
                  style={{
                    color: theme === key ? 'var(--color-accent)' : 'var(--color-text)',
                    background: theme === key ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : undefined
                  }}
                >
                  {/* Color swatch */}
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      background: meta.accent,
                      boxShadow: theme === key ? `0 0 0 2px ${meta.accent}40` : undefined
                    }}
                  />
                  {meta.label}
                  {theme === key && (
                    <span className="ml-auto text-[10px]" style={{ color: 'var(--color-accent)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
