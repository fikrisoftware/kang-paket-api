import { useState, useMemo, useEffect } from 'react'
import { FolderOpen, Clock, Plus, FolderPlus, Upload, Download, History } from 'lucide-react'
import { useProjectStore } from '../../store/projectStore'
import { useUiStore } from '../../store/uiStore'
import { useTabStore } from '../../store/tabStore'
import { useEnvStore } from '../../store/envStore'
import { MethodBadge } from '../common/MethodBadge'
import { NewProjectDialog } from '../project/NewProjectDialog'
import { ExportDialog } from '../importexport/ExportDialog'
import { ImportReviewDialog } from '../importexport/ImportReviewDialog'
import { ScrollArea } from '../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { Separator } from '../ui/separator'
import { cn } from '../../lib/utils'
import { ipc } from '../../lib/ipc'
import type { RequestItem } from '../../types/collection'
import type { Environment } from '../../types/environment'
import type { WorkspaceTree } from '../../types/project'

export function Sidebar(): JSX.Element {
  const { sidebarPanel, setSidebarPanel } = useUiStore()
  const workspace = useProjectStore((s) => s.workspace)
  const { setWorkspace, recentPaths } = useProjectStore()
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
          onOpenProject={openProject}
          onNewProject={() => { setImportResult(null); setShowNewProject(true) }}
        />
      )}

      {/* Icon rail — 44px */}
      <div
        className="flex flex-col items-center gap-1 py-3 px-1.5"
        style={{ width: 44, borderRight: '1px solid var(--color-border)', flexShrink: 0 }}
      >
        {[
          { panel: 'collections' as const, icon: FolderOpen, title: 'Collections' },
          { panel: 'history' as const, icon: Clock, title: 'History' }
        ].map(({ panel, icon: Icon, title }) => (
          <Tooltip key={panel}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarPanel(sidebarPanel === panel ? null : panel)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
                  sidebarPanel === panel
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
                style={
                  sidebarPanel === panel
                    ? { background: 'var(--color-bg)', color: 'var(--color-accent)' }
                    : { color: 'var(--color-text-muted)' }
                }
              >
                <Icon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={6}>
              {title}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Panel content — 224px */}
      {sidebarPanel && (
        <div className="flex flex-col" style={{ width: 224, overflow: 'hidden', flexShrink: 0 }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2.5" style={{ flexShrink: 0 }}>
            <span
              className="font-medium tracking-wider uppercase"
              style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
            >
              {sidebarPanel === 'collections' ? 'Collections' : 'History'}
            </span>

            {sidebarPanel === 'collections' && (
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={importFile}
                      className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-accent/50"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Upload size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Import collection</TooltipContent>
                </Tooltip>

                {workspace && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowExport(true)}
                        className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-accent/50"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Download size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Export collection</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={openProject}
                      className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-accent/50"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <FolderOpen size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Buka project</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowNewProject(true)}
                      className="flex items-center justify-center w-6 h-6 rounded transition-colors hover:bg-accent/50"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <FolderPlus size={13} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Buat project baru</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          <Separator style={{ background: 'var(--color-border)' }} />

          {/* Panel body */}
          <ScrollArea className="flex-1">
            {sidebarPanel === 'collections' && (
              <CollectionsPanel
                collections={collections}
                projectName={workspace?.meta.name}
                projectPath={workspace?.projectPath}
                hasWorkspace={!!workspace}
                recentPaths={recentPaths}
                onOpenProject={openProject}
                onOpenRecent={async (path) => {
                  const result = await ipc.loadProject(path)
                  setWorkspace(result)
                }}
                onNewProject={() => setShowNewProject(true)}
                onNewRequest={() => addTab()}
              />
            )}
            {sidebarPanel === 'history' && <HistoryPanel />}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function CollectionsPanel({
  collections,
  projectName,
  projectPath,
  hasWorkspace,
  recentPaths,
  onOpenProject,
  onOpenRecent,
  onNewProject,
  onNewRequest
}: {
  collections: Record<string, RequestItem[]>
  projectName?: string
  projectPath?: string
  hasWorkspace: boolean
  recentPaths: string[]
  onOpenProject: () => void
  onOpenRecent: (path: string) => void
  onNewProject: () => void
  onNewRequest: () => void
}): JSX.Element {
  const { addTab } = useTabStore()

  function projectLabel(path: string): string {
    return path.replace(/\\/g, '/').split('/').pop() ?? path
  }

  if (!hasWorkspace) {
    return (
      <div className="flex flex-col gap-1 p-3">
        {/* Action buttons */}
        <button
          onClick={onOpenProject}
          className="flex items-center gap-2 w-full text-xs px-3 py-2.5 rounded-md transition-colors hover:opacity-90"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <FolderOpen size={13} />
          Buka Project
        </button>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 w-full text-xs px-3 py-2.5 rounded-md transition-colors"
          style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
        >
          <FolderPlus size={13} />
          Buat Project Baru
        </button>

        {/* Recent projects */}
        {recentPaths.length > 0 && (
          <div className="mt-3">
            <div
              className="flex items-center gap-1.5 px-1 pb-1.5 font-semibold uppercase tracking-wider"
              style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
            >
              <History size={10} />
              Terakhir dibuka
            </div>
            {recentPaths.map((path) => (
              <button
                key={path}
                onClick={() => onOpenRecent(path)}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-md text-left transition-colors hover:bg-[var(--color-border)]"
                title={path}
              >
                <FolderOpen size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {projectLabel(path)}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {path}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {recentPaths.length === 0 && (
          <p className="text-xs text-center mt-4 leading-relaxed px-2" style={{ color: 'var(--color-text-muted)' }}>
            Buka atau buat project untuk mulai menyimpan request.
          </p>
        )}
      </div>
    )
  }

  if (Object.keys(collections).length === 0) {
    return (
      <div className="p-4 flex flex-col gap-3">
        <button
          onClick={onNewRequest}
          className="flex items-center justify-center gap-1.5 text-xs w-full px-3 py-2 rounded-md hover:opacity-80 transition-opacity"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <Plus size={12} /> New Request
        </button>
        <p className="text-xs text-center mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Project kosong. Buat request pertama Anda.
        </p>
      </div>
    )
  }

  return (
    <div className="py-2">
      {projectName && (
        <>
          <div className="px-3 py-2.5 flex items-center gap-2">
            <FolderOpen size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                {projectName}
              </div>
              {projectPath && (
                <div className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }} title={projectPath}>
                  {projectPath}
                </div>
              )}
            </div>
          </div>
          <Separator className="mb-2" style={{ background: 'var(--color-border)' }} />
        </>
      )}

      {Object.entries(collections).map(([name, requests]) => (
        <div key={name} className="mb-2">
          {/* Collection header */}
          <div
            className="px-3 pb-1 pt-2 font-medium tracking-wider uppercase"
            style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
          >
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
              className={cn(
                'flex items-center gap-2 w-full py-2 px-3 text-xs text-left rounded-md mx-1 transition-colors',
                'hover:bg-accent/50'
              )}
              style={{ color: 'var(--color-text)', width: 'calc(100% - 8px)' }}
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
    <div className="py-2">
      <div className="flex justify-end px-3 pb-2">
        <button
          onClick={clearAll}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Hapus semua
        </button>
      </div>

      {Object.entries(groups).map(([date, items], groupIdx) => (
        <div key={date} className="mb-2">
          {/* Date group header */}
          <div
            className="px-3 pb-1 pt-2 font-medium tracking-wider uppercase"
            style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
          >
            {date}
          </div>

          {items.map((entry) => (
            <button
              key={entry.id}
              onClick={() => addTab({
                name: `${entry.method} ${entry.url.replace(/^https?:\/\//, '').slice(0, 30)}`,
                request: { method: entry.method, url: entry.url, headers: [], body: { type: 'none', content: '' }, auth: { type: 'none' } }
              })}
              className={cn(
                'flex items-center gap-2 w-full py-2 px-3 text-xs text-left rounded-md mx-1 transition-colors',
                'hover:bg-accent/50'
              )}
              style={{ color: 'var(--color-text)', width: 'calc(100% - 8px)' }}
            >
              <MethodBadge method={entry.method} />
              <span className="flex-1 truncate min-w-0" style={{ color: 'var(--color-text-muted)' }}>
                {entry.url.replace(/^https?:\/\//, '')}
              </span>
              <span className="text-xs font-medium tabular-nums flex-shrink-0" style={{ color: statusColor(entry.status) }}>
                {entry.status || '—'}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>
                {formatTime(entry.timestamp)}
              </span>
            </button>
          ))}

          {groupIdx < Object.keys(groups).length - 1 && (
            <Separator className="mt-2" style={{ background: 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}
