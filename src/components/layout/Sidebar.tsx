import { FolderOpen, Clock, Plus, FolderPlus, Download, Upload } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'
import { MethodBadge } from '../common/MethodBadge'

export function Sidebar(): JSX.Element {
  const { sidebarPanel, setSidebarPanel } = useUiStore()
  const { workspace, setWorkspace } = useProjectStore()
  const { addTab } = useTabStore()

  async function openProject(): Promise<void> {
    const result = await window.electronAPI.openProject()
    if (result) setWorkspace(result)
  }

  async function importFile(): Promise<void> {
    const result = await window.electronAPI.importFile()
    if (result) setWorkspace(result)
  }

  const collections = useProjectStore((s) => s.getCollections())

  return (
    <div
      className="flex h-full"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
    >
      {/* Icon rail */}
      <div
        className="flex flex-col items-center gap-1 py-2 px-1"
        style={{ width: 40, borderRight: '1px solid var(--color-border)' }}
      >
        {[
          { panel: 'collections' as const, icon: FolderOpen, title: 'Collections' },
          { panel: 'history' as const, icon: Clock, title: 'History' }
        ].map(({ panel, icon: Icon, title }) => (
          <button
            key={panel}
            onClick={() => setSidebarPanel(sidebarPanel === panel ? null : panel)}
            title={title}
            className="flex items-center justify-center w-7 h-7 rounded transition-colors"
            style={{
              color: sidebarPanel === panel ? 'var(--color-accent)' : 'var(--color-text-muted)',
              background: sidebarPanel === panel ? 'var(--color-bg)' : 'transparent'
            }}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Panel content */}
      {sidebarPanel && (
        <div className="flex flex-col" style={{ width: 220, overflow: 'hidden' }}>
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {sidebarPanel === 'collections' ? 'Collections' : 'History'}
            </span>
            {sidebarPanel === 'collections' && (
              <div className="flex gap-1">
                <button onClick={importFile} title="Import collection" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <Upload size={13} />
                </button>
                <button onClick={openProject} title="Open project" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <FolderPlus size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">
            {sidebarPanel === 'collections' && (
              <CollectionsPanel
                collections={collections}
                hasWorkspace={!!workspace}
                onOpenProject={openProject}
                onNewRequest={() => addTab()}
              />
            )}
            {sidebarPanel === 'history' && <HistoryPanel />}
          </div>
        </div>
      )}
    </div>
  )
}

function CollectionsPanel({
  collections,
  hasWorkspace,
  onOpenProject,
  onNewRequest
}: {
  collections: Record<string, import('../../types/collection').RequestItem[]>
  hasWorkspace: boolean
  onOpenProject: () => void
  onNewRequest: () => void
}): JSX.Element {
  const { addTab } = useTabStore()

  if (!hasWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-4 h-40">
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Buka project atau import collection untuk memulai.
        </p>
        <button
          onClick={onOpenProject}
          className="text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Buka Project
        </button>
      </div>
    )
  }

  if (Object.keys(collections).length === 0) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <button
          onClick={onNewRequest}
          className="flex items-center gap-1.5 text-xs w-full px-2 py-1.5 rounded hover:opacity-80 transition-opacity"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <Plus size={12} /> New Request
        </button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Project kosong. Buat request pertama Anda.
        </p>
      </div>
    )
  }

  return (
    <div className="py-1">
      {Object.entries(collections).map(([name, requests]) => (
        <div key={name}>
          <div
            className="px-3 py-1.5 text-xs font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {name}
          </div>
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => addTab({ name: req.name, request: req })}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text)' }}
            >
              <MethodBadge method={req.method} />
              <span className="truncate">{req.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function HistoryPanel(): JSX.Element {
  return (
    <div className="flex items-center justify-center h-24">
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Belum ada history.
      </p>
    </div>
  )
}
