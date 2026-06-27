import { useState, useMemo, useEffect } from 'react'
import { FolderOpen, Clock, Plus, FolderPlus, Upload, Download, History, Folder, ChevronRight, ChevronDown } from 'lucide-react'
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

  const tree = useMemo(() => buildTree(workspace?.requests ?? []), [workspace])

  // Workspace sementara = ada isi tapi belum punya folder project di disk.
  const isTemp = !!workspace && !workspace.projectPath

  async function openProject(): Promise<void> {
    const result = await ipc.openProject()
    if (result) setWorkspace(result)
  }

  async function openRecent(path: string): Promise<void> {
    const result = await ipc.loadProject(path)
    setWorkspace(result)
  }

  // Tulis semua request workspace sementara ke project di disk (mempertahankan groupPath).
  async function saveTempInto(projectPath: string): Promise<void> {
    const reqs = workspace?.requests ?? []
    for (const req of reqs) {
      const groupPath = req.groupPath?.length
        ? req.groupPath
        : req.collectionName ? [req.collectionName] : ['Imported']
      await ipc.saveRequest(projectPath, groupPath[0], { ...req, groupPath })
    }
    setWorkspace(await ipc.loadProject(projectPath))
  }

  // Simpan workspace sementara ke project yang sudah ada (pilih folder).
  async function handleSaveTempToExisting(): Promise<void> {
    const opened = await ipc.openProject()
    if (!opened) return
    await saveTempInto(opened.projectPath)
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
      // Nama collection pilihan jadi root, hierarki folder asal dinest di bawahnya.
      const groupPath = req.groupPath?.length ? [collectionName, ...req.groupPath] : [collectionName]
      await ipc.saveRequest(workspace.projectPath, collectionName, { ...req, collectionName, groupPath })
    }
    const updated = await ipc.loadProject(workspace.projectPath)
    setWorkspace(updated)
    applyEnvironments(envs)
    setImportResult(null)
  }

  async function handleCreateProject(name: string, dirPath: string): Promise<void> {
    setShowNewProject(false)
    await ipc.createProject(dirPath, name)
    // Jika sedang di workspace sementara, pindahkan isinya ke project baru.
    if (isTemp) {
      await saveTempInto(dirPath)
    } else {
      setWorkspace(await ipc.loadProject(dirPath))
    }
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

      {/* Panel content — isi sisa lebar panel */}
      {sidebarPanel && (
        <div className="flex flex-col" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
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
                tree={tree}
                projectName={workspace?.meta.name}
                projectPath={workspace?.projectPath}
                hasWorkspace={!!workspace}
                isTemp={isTemp}
                recentPaths={recentPaths}
                onOpenProject={openProject}
                onOpenRecent={openRecent}
                onNewProject={() => setShowNewProject(true)}
                onNewRequest={() => addTab()}
                onSaveTempToExisting={handleSaveTempToExisting}
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
  tree,
  projectName,
  projectPath,
  hasWorkspace,
  isTemp,
  recentPaths,
  onOpenProject,
  onOpenRecent,
  onNewProject,
  onNewRequest,
  onSaveTempToExisting
}: {
  tree: TreeNode
  projectName?: string
  projectPath?: string
  hasWorkspace: boolean
  isTemp: boolean
  recentPaths: string[]
  onOpenProject: () => void
  onOpenRecent: (path: string) => void
  onNewProject: () => void
  onNewRequest: () => void
  onSaveTempToExisting: () => void
}): JSX.Element {
  const isEmpty = tree.children.size === 0 && tree.requests.length === 0

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

        {recentPaths.length > 0 ? (
          <div className="mt-3">
            <RecentProjects recentPaths={recentPaths} onOpenRecent={onOpenRecent} defaultOpen />
          </div>
        ) : (
          <p className="text-xs text-center mt-4 leading-relaxed px-2" style={{ color: 'var(--color-text-muted)' }}>
            Buka atau buat project untuk mulai menyimpan request.
          </p>
        )}
      </div>
    )
  }

  if (isEmpty && !isTemp) {
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

  // Anak-anak root, folder dulu (terurut) baru request lepasan.
  const rootFolders = [...tree.children.values()].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="py-2 flex flex-col h-full">
      {/* Banner workspace sementara */}
      {isTemp && (
        <div
          className="mx-2 mb-2 p-3 rounded-lg"
          style={{ background: 'color-mix(in srgb, #fbbf24 12%, transparent)', border: '1px solid color-mix(in srgb, #fbbf24 35%, transparent)' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#fbbf24' }}>
              Workspace sementara
            </span>
          </div>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
            Belum tersimpan ke disk — akan hilang saat app ditutup.
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 w-full text-xs px-3 py-2 rounded-md transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
              <FolderPlus size={13} /> Simpan ke project baru
            </button>
            <button
              onClick={onSaveTempToExisting}
              className="flex items-center gap-2 w-full text-xs px-3 py-2 rounded-md transition-colors"
              style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            >
              <FolderOpen size={13} /> Simpan ke project yang ada
            </button>
          </div>
        </div>
      )}

      {projectName && !isTemp && (
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
          <Separator className="mb-1" style={{ background: 'var(--color-border)' }} />
        </>
      )}

      <div className="flex-1">
        {rootFolders.map((node) => (
          <TreeFolder key={node.name} node={node} depth={0} />
        ))}

        {/* Request tanpa grup (langsung di root) */}
        {tree.requests.map((req) => (
          <RequestRow key={req.id} req={req} depth={0} />
        ))}

        {isEmpty && (
          <p className="text-xs text-center px-3 py-4 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Belum ada request di workspace ini.
          </p>
        )}
      </div>

      {/* Footer: recent projects selalu bisa diakses */}
      {recentPaths.length > 0 && (
        <div className="mt-2 px-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <RecentProjects recentPaths={recentPaths} onOpenRecent={onOpenRecent} defaultOpen={false} />
        </div>
      )}
    </div>
  )
}

function RecentProjects({
  recentPaths,
  onOpenRecent,
  defaultOpen
}: {
  recentPaths: string[]
  onOpenRecent: (path: string) => void
  defaultOpen: boolean
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const projectLabel = (path: string): string => path.replace(/\\/g, '/').split('/').pop() ?? path

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 w-full px-1 pb-1.5 font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
        style={{ fontSize: 10, color: 'var(--color-text-muted)' }}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <History size={11} />
        <span className="flex-1 text-left">Terakhir dibuka</span>
        <span className="tabular-nums">{recentPaths.length}</span>
      </button>
      {open && recentPaths.map((path) => (
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
  )
}

// ─── Tree model & rendering ─────────────────────────────────────────────────

interface TreeNode {
  name: string
  children: Map<string, TreeNode>
  requests: RequestItem[]
}

function buildTree(requests: RequestItem[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map(), requests: [] }
  for (const req of requests) {
    const path = req.groupPath?.length
      ? req.groupPath
      : req.collectionName
        ? [req.collectionName]
        : []
    if (path.length === 0) {
      root.requests.push(req)
      continue
    }
    let node = root
    for (const segment of path) {
      let child = node.children.get(segment)
      if (!child) {
        child = { name: segment, children: new Map(), requests: [] }
        node.children.set(segment, child)
      }
      node = child
    }
    node.requests.push(req)
  }
  return root
}

function RequestRow({ req, depth }: { req: RequestItem; depth: number }): JSX.Element {
  const openSavedRequest = useTabStore((s) => s.openSavedRequest)
  return (
    <button
      onClick={() => openSavedRequest(req)}
      className="flex items-center gap-2 w-full py-1.5 pr-3 text-xs text-left rounded-md transition-colors hover:bg-accent/50"
      style={{ color: 'var(--color-text)', paddingLeft: 12 + depth * 14 }}
    >
      <MethodBadge method={req.method} />
      <span className="truncate">{req.name}</span>
    </button>
  )
}

function TreeFolder({ node, depth }: { node: TreeNode; depth: number }): JSX.Element {
  const [open, setOpen] = useState(true)
  const childFolders = [...node.children.values()].sort((a, b) => a.name.localeCompare(b.name))
  const count = countRequests(node)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 w-full py-1.5 pr-2 text-left rounded-md transition-colors hover:bg-accent/50"
        style={{ paddingLeft: 8 + depth * 14, color: 'var(--color-text)' }}
      >
        {open
          ? <ChevronDown size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />}
        <Folder size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
        <span className="text-xs font-medium truncate flex-1">{node.name}</span>
        <span className="text-[10px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>{count}</span>
      </button>

      {open && (
        <>
          {childFolders.map((child) => (
            <TreeFolder key={child.name} node={child} depth={depth + 1} />
          ))}
          {node.requests.map((req) => (
            <RequestRow key={req.id} req={req} depth={depth + 1} />
          ))}
        </>
      )}
    </div>
  )
}

function countRequests(node: TreeNode): number {
  let total = node.requests.length
  for (const child of node.children.values()) total += countRequests(child)
  return total
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
