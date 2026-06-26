import { Moon, Sun, Github } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useProjectStore } from '../../store/projectStore'

export function TopBar(): JSX.Element {
  const { theme, toggleTheme } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        height: 40,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion']
      } as React.CSSProperties}
    >
      {/* App name + project */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
          Kang Paket API
        </span>
        {workspace && (
          <>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {workspace.meta.name}
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="flex items-center justify-center w-7 h-7 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  )
}
