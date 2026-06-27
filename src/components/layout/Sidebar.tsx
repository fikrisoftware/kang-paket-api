import { useState, useMemo } from 'react'
import { FolderOpen, Clock, Plus, FolderPlus, Upload, Download } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'
import { MethodBadge } from '../common/MethodBadge'
import { NewProjectDialog } from '../project/NewProjectDialog'
import { ExportDialog } from '../importexport/ExportDialog'
import { ipc } from '../../lib/ipc'
import type { RequestItem } from '../../types/collection'

export function Sidebar(): JSX.Element {
  const { sidebarPanel, setSidebarPanel } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)
  const { setWorkspace } = useProjectStore()
  const { addTab } = useTabStore()
  const [showNewProject, setShowNewProject] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const collections = useMemo(() => {
    const reqs = workspace?.requests ?? []
    return reqs.reduce<Record<string, RequestItem[]>>((acc, r) => {
      const key = r.collectionName ?? 'Default'
      if (!acc[key]) acc[key] = []
      acc[key].push(r)
      return acc
    }, {})
  }, [workspace])

  async function openProject(): Promise<void> {
    const result = await ipc.openProject()
    if (result) setWorkspace(result)
  }

  async function importFile(): Promise<void> {
    const result = await ipc.importFile()
    if (result) setWorkspace(result)
  }

  async function handleCreateProject(name: string, dirPath: string): Promise<void> {
    setShowNewProject(false)
    const result = await ipc.createProject(dirPath, name)
    setWorkspace(result)
  }

  return (
    <div
      className="flex h-full"
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
    >
      {showNewProject && (
        <NewProjectDialog
          onClose={() => setShowNewProject(false)}
          onConfirm={handleCreateProject}
        />
      )}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}

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
                {workspace && (
                  <button onClick={() => setShowExport(true)} title="Export collection" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                    <Download size={13} />
                  </button>
                )}
                <button onClick={openProject} title="Buka project" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                  <FolderOpen size={13} />
                </button>
                <button onClick={() => setShowNewProject(true)} title="Buat project baru" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
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
                projectName={workspace?.meta.name}
                hasWorkspace={!!workspace}
                onOpenProject={openProject}
                onNewProject={() => setShowNewProject(true)}
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
  projectName,
  hasWorkspace,
  onOpenProject,
  onNewProject,
  onNewRequest
}: {
  collections: Record<string, RequestItem[]>
  projectName?: string
  hasWorkspace: boolean
  onOpenProject: () => void
  onNewProject: () => void
  onNewRequest: () => void
}): JSX.Element {
  const { addTab } = useTabStore()

  if (!hasWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          Buka atau buat project untuk mulai menyimpan request.
        </p>
        <button
          onClick={onOpenProject}
          className="text-xs px-3 py-1.5 rounded w-full transition-opacity hover:opacity-80"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          Buka Project
        </button>
        <button
          onClick={onNewProject}
          className="text-xs px-3 py-1.5 rounded w-full transition-opacity hover:opacity-80"
          style={{ background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
        >
          Buat Project Baru
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
      {projectName && (
        <div
          className="px-3 py-2 mb-1 flex items-center gap-1.5"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <FolderOpen size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
            {projectName}
          </span>
        </div>
      )}
      {Object.entries(collections).map(([name, requests]) => (
        <div key={name}>
          <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
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
