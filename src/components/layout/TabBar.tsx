import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { useTabStore } from '../../store/tabStore'
import { MethodBadge } from '../common/MethodBadge'
import { cn } from '../../lib/utils'

export function TabBar(): JSX.Element {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabStore()

  // Shortcut: Ctrl/Cmd+T tab baru, Ctrl/Cmd+W tutup tab aktif.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 't') {
        e.preventDefault()
        addTab()
      } else if (mod && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        closeTab(activeTabId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addTab, closeTab, activeTabId])

  return (
    <div
      className="flex items-stretch overflow-x-auto"
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        height: 36,
        flexShrink: 0
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'group relative flex items-center gap-1.5 px-4 shrink-0 text-xs transition-colors',
              'border-r',
              isActive
                ? 'font-medium'
                : 'hover:bg-[var(--color-bg)]'
            )}
            style={{
              borderColor: 'var(--color-border)',
              background: isActive ? 'var(--color-bg)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              maxWidth: 192
            }}
          >
            {/* Active tab accent underline */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                style={{ background: 'var(--color-accent)' }}
              />
            )}

            <MethodBadge method={tab.request.method} />
            <span className="truncate flex-1 text-left">{tab.name}</span>

            {tab.isDirty && !isActive && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
            )}

            {tabs.length > 1 && (
              <span
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded shrink-0 cursor-pointer',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  'hover:text-red-400 hover:bg-[var(--color-border)]'
                )}
              >
                <X size={10} />
              </span>
            )}
          </button>
        )
      })}

      {/* New tab button */}
      <button
        onClick={() => addTab()}
        className={cn(
          'flex items-center justify-center w-9 shrink-0 transition-colors',
          'hover:bg-[var(--color-bg)]'
        )}
        style={{ color: 'var(--color-text-muted)' }}
        title="New request (Ctrl+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
