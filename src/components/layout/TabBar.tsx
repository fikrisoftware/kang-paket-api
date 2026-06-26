import { Plus, X } from 'lucide-react'
import { useTabStore } from '../../store/tabStore'
import { MethodBadge } from '../common/MethodBadge'

export function TabBar(): JSX.Element {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab } = useTabStore()

  return (
    <div
      className="flex items-center border-b overflow-x-auto"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
        minHeight: 36,
        flexShrink: 0
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="group flex items-center gap-1.5 px-3 border-r shrink-0 h-9 text-xs transition-colors"
          style={{
            borderColor: 'var(--color-border)',
            background: tab.id === activeTabId ? 'var(--color-bg)' : 'transparent',
            color: tab.id === activeTabId ? 'var(--color-text)' : 'var(--color-text-muted)',
            borderBottom: tab.id === activeTabId ? '2px solid var(--color-accent)' : '2px solid transparent',
            maxWidth: 180
          }}
        >
          <MethodBadge method={tab.request.method} />
          <span className="truncate flex-1 text-left">{tab.name}</span>
          {tab.isDirty && (
            <span style={{ color: 'var(--color-accent)', fontSize: 16, lineHeight: 1 }}>•</span>
          )}
          {tabs.length > 1 && (
            <span
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 rounded p-0.5 transition-opacity cursor-pointer"
            >
              <X size={11} />
            </span>
          )}
        </button>
      ))}

      <button
        onClick={() => addTab()}
        className="flex items-center justify-center w-8 h-9 shrink-0 transition-colors hover:opacity-70"
        style={{ color: 'var(--color-text-muted)' }}
        title="New request (Ctrl+T)"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
