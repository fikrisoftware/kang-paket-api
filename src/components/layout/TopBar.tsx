import { Moon, Sun } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useProjectStore } from '../../store/projectStore'
import { EnvSelector } from '../environment/EnvSelector'
import { cn } from '../../lib/utils'

export function TopBar(): JSX.Element {
  const { theme, toggleTheme } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)

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
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded',
            'transition-colors hover:bg-[var(--color-border)]'
          )}
          style={{ color: 'var(--color-text-muted)' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}
