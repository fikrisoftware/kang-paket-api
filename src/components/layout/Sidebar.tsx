import { useState, useMemo, useEffect } from 'react'
import { FolderOpen, Clock, Plus, FolderPlus, Upload, Download } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'
import { useEnvStore } from '../../store/envStore'
import { MethodBadge } from '../common/MethodBadge'
import { NewProjectDialog } from '../project/NewProjectDialog'
import { ExportDialog } from '../importexport/ExportDialog'
import { ImportReviewDialog } from '../importexport/ImportReviewDialog'
import { ipc } from '../../lib/ipc'
import type { RequestItem } from '../../types/collection'
import type { Environment } from '../../types/environment'
import type { WorkspaceTree } from '../../types/project'

export function Sidebar(): JSX.Element {
  const { sidebarPanel, setSidebarPanel } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)
  const { setWorkspace } = useProjectStore()
  const { addTab } = useTabStore()
  const { addEnvironment, setVariables, environments } = useEnvStore()
  const [showNewProject, setShowNewProject] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [importResult, setImportResult] = useState<WorkspaceTree | null>(null)

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
    if (!result) return
    setImportResult(result)
  }

  function applyEnvironments(envs: Environment[]): void {
    for (const env of envs) {
      const exists = environments.find((e) => e.name === env.name)
      if (!exists) addEnvironment(env.name)
      setVariables(env.name, env.variables)
    }
  }

  function handleImportTemp(requests: RequestItem[], envs: Environment[]): void {
    setImportResult(null)
    setWorkspace({
      projectPath: '',
      meta: { name: 'Imported', version: '1', createdAt: new Date().toISOString() },
      requests
    })
    applyEnvironments(envs)
  }

  async function handleImportSave(requests: RequestItem[], envs: Environment[], collectionName: string): Promise<void> {
    if (!workspace?.projectPath) return
    for (const req of requests) {
      await ipc.saveRequest(workspace.projectPath, collectionName, { ...req, collectionName })
    }
    const updated = await ipc.loadProject(workspace.projectPath)
    setWorkspace(updated)
    applyEnvironments(envs)
    setImportResult(null)
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
      {importResult && (
        <ImportReviewDialog
          requests={importResult.requests}
          environments={importResult.environments ?? []}
          existingRequests={workspace?.requests ?? []}
          hasProject={!!workspace?.projectPath}
          onClose={() => setImportResult(null)}
          onConfirmTemp={handleImportTemp}
          onConfirmSave={handleImportSave}
        />
      )}

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
              onClick={() => addTab({
                name: req.name,
                request: {
                  method: req.method,
                  url: req.url,
                  headers: req.headers,
                  body: req.body,
                  auth: req.auth
                }
              })}
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

function statusColor(status: number): string {
  if (status === 0) return 'var(--color-text-muted)'
  if (status < 300) return '#10b981'
  if (status < 400) return '#3b82f6'
  if (status < 500) return '#f59e0b'
  return '#ef4444'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hari ini'
  if (d.toDateString() === yesterday.toDateString()) return 'Kemarin'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function HistoryPanel(): JSX.Element {
  const { addTab } = useTabStore()
  const [entries, setEntries] = useState<import('../../types/history').HistoryEntry[]>([])

  useEffect(() => {
    ipc.getHistory().then(setEntries).catch(() => {})
  }, [])

  async function clearAll(): Promise<void> {
    await ipc.clearHistory()
    setEntries([])
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-24">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Belum ada history.</p>
      </div>
    )
  }

  // Group by date
  const groups: Record<string, typeof entries> = {}
  for (const e of entries) {
    const key = formatDate(e.timestamp)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }

  return (
    <div className="py-1">
      <div className="flex justify-end px-3 pb-1">
        <button
          onClick={clearAll}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Hapus semua
        </button>
      </div>
      {Object.entries(groups).map(([date, items]) => (
        <div key={date}>
          <div className="px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            {date}
          </div>
          {items.map((entry) => (
            <button
              key={entry.id}
              onClick={() => addTab({
                name: `${entry.method} ${entry.url.replace(/^https?:\/\//, '').slice(0, 30)}`,
                request: { method: entry.method, url: entry.url, headers: [], body: { type: 'none', content: '' }, auth: { type: 'none' } }
              })}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text)' }}
            >
              <MethodBadge method={entry.method} />
              <span className="flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                {entry.url.replace(/^https?:\/\//, '')}
              </span>
              <span style={{ color: statusColor(entry.status), flexShrink: 0 }}>
                {entry.status || '—'}
              </span>
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {formatTime(entry.timestamp)}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
