import { useState, useEffect } from 'react'
import { Save, Check } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { UrlBar } from './UrlBar'
import { RequestTabs } from './RequestTabs'
import { ResponseViewer } from '../response/ResponseViewer'
import { SaveRequestDialog } from './SaveRequestDialog'
import { useTabStore, useActiveTab } from '../../store/tabStore'
import { useProjectStore } from '../../store/projectStore'
import { useEnvStore } from '../../store/envStore'
import { ipc } from '../../lib/ipc'
import { substituteVars } from '../../lib/envSubstitution'
import type { PaketRequest } from '../../types/request'
import type { RequestItem } from '../../types/collection'
import { v4 as uuidv4 } from 'uuid'
import type { HistoryEntry } from '../../types/history'

export function RequestPanel(): JSX.Element {
  const activeTab = useActiveTab()
  const { updateRequest, updateTab, activeTabId } = useTabStore()
  const { workspace, setWorkspace } = useProjectStore()
  const getActiveVars = useEnvStore((s) => s.getActiveVars)
  const [showSave, setShowSave] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  function flashSaved(): void {
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1600)
  }

  // Shortcut: Ctrl/Cmd+S simpan, Ctrl/Cmd+Enter kirim. (Dipasang sebelum early-return
  // agar urutan hooks selalu konsisten.)
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSaveClick()
      } else if (mod && e.key === 'Enter') {
        e.preventDefault()
        void handleSend()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, workspace])

  if (!activeTab) return <></>

  function handleUpdate(patch: Partial<PaketRequest>): void {
    updateRequest(activeTabId, patch)
    // Auto-rename dari URL hanya untuk request baru (belum tersimpan), supaya
    // nama request yang sudah disimpan tidak tertimpa saat mengedit URL.
    if (patch.url !== undefined && !activeTab?.savedId) {
      const urlName = patch.url.split('?')[0].split('/').pop() || 'New Request'
      if (urlName) updateTab(activeTabId, { name: urlName })
    }
  }

  async function handleSend(): Promise<void> {
    if (!activeTab?.request.url.trim()) return
    updateTab(activeTabId, { isLoading: true, response: null })
    try {
      const vars = getActiveVars()
      const req = activeTab.request
      const resolvedRequest: PaketRequest = {
        ...req,
        url: substituteVars(req.url, vars),
        headers: req.headers.map((h) => ({
          ...h,
          key: substituteVars(h.key, vars),
          value: substituteVars(h.value, vars)
        })),
        body: {
          ...req.body,
          content: substituteVars(req.body.content, vars),
          formData: req.body.formData?.map((f) => ({
            ...f,
            key: substituteVars(f.key, vars),
            value: substituteVars(f.value, vars)
          }))
        },
        auth: {
          ...req.auth,
          token: req.auth.token ? substituteVars(req.auth.token, vars) : undefined,
          password: req.auth.password ? substituteVars(req.auth.password, vars) : undefined,
          apiKeyValue: req.auth.apiKeyValue ? substituteVars(req.auth.apiKeyValue, vars) : undefined
        }
      }
      const response = await ipc.executeRequest(resolvedRequest)
      updateTab(activeTabId, { response, isLoading: false, isDirty: false })
      const entry: HistoryEntry = {
        id: uuidv4(),
        method: resolvedRequest.method,
        url: resolvedRequest.url,
        status: response.status,
        durationMs: response.durationMs,
        timestamp: new Date().toISOString()
      }
      ipc.appendHistory(entry).catch(() => {})
    } catch (err) {
      updateTab(activeTabId, {
        isLoading: false,
        response: {
          status: 0,
          statusText: 'Error',
          headers: {},
          body: err instanceof Error ? err.message : 'Unknown error',
          durationMs: 0,
          sizeBytes: 0
        }
      })
    }
  }

  // Update file .kp.json yang sama (request yang sudah terhubung ke disk).
  async function saveInPlace(): Promise<void> {
    if (!workspace?.projectPath || !activeTab?.savedId) return
    const existing = workspace.requests.find((r) => r.id === activeTab.savedId)
    const collectionName = activeTab.collectionName ?? activeTab.groupPath?.[0] ?? 'Default'
    const req: RequestItem = {
      ...activeTab.request,
      id: activeTab.savedId,
      name: activeTab.name,
      collectionName,
      groupPath: activeTab.groupPath,
      filePath: activeTab.filePath,
      meta: { createdAt: existing?.meta.createdAt ?? new Date().toISOString() }
    }
    await ipc.saveRequest(workspace.projectPath, collectionName, req)
    setWorkspace(await ipc.loadProject(workspace.projectPath))
    updateTab(activeTabId, { isDirty: false })
    flashSaved()
  }

  // Simpan request baru (atau "save as") via dialog: pilih nama & collection.
  async function handleSaveDialog(name: string, collectionName: string): Promise<void> {
    if (!workspace?.projectPath) return
    setShowSave(false)
    const id = uuidv4()
    const groupPath = [collectionName]
    const req: RequestItem = {
      ...(activeTab!.request as PaketRequest),
      id,
      name,
      collectionName,
      groupPath,
      meta: { createdAt: new Date().toISOString() }
    }
    await ipc.saveRequest(workspace.projectPath, collectionName, req)
    const updated = await ipc.loadProject(workspace.projectPath)
    setWorkspace(updated)
    const saved = updated.requests.find((r) => r.id === id)
    // Hubungkan tab ini ke request yang baru disimpan agar Simpan berikutnya update di tempat.
    updateTab(activeTabId, {
      name,
      isDirty: false,
      savedId: id,
      filePath: saved?.filePath,
      collectionName,
      groupPath
    })
    flashSaved()
  }

  // Tombol/Ctrl+S: kalau tab sudah terhubung → update di tempat; kalau belum → dialog.
  function handleSaveClick(): void {
    if (!workspace?.projectPath) return
    if (activeTab?.savedId) void saveInPlace()
    else setShowSave(true)
  }

  const canSave = !!workspace?.projectPath
  const isLinked = !!activeTab?.savedId

  return (
    <div className="flex flex-col h-full">
      {showSave && canSave && (
        <SaveRequestDialog
          defaultName={activeTab?.name ?? 'New Request'}
          onClose={() => setShowSave(false)}
          onConfirm={handleSaveDialog}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <UrlBar
            method={activeTab.request.method}
            url={activeTab.request.url}
            isLoading={activeTab.isLoading}
            onMethodChange={(method) => handleUpdate({ method })}
            onUrlChange={(url) => handleUpdate({ url })}
            onSend={handleSend}
          />
        </div>
        {canSave && (
          <button
            onClick={handleSaveClick}
            title={isLinked ? 'Simpan perubahan ke file request (Ctrl+S)' : 'Simpan request ke collection (Ctrl+S)'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 18px', height: 52, fontSize: 13, cursor: 'pointer',
              background: 'transparent',
              color: savedFlash ? 'var(--color-accent)' : activeTab.isDirty ? 'var(--color-accent)' : 'var(--color-text-muted)',
              border: '0', borderLeft: '1px solid var(--color-border)',
              transition: 'color 0.15s', flexShrink: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = savedFlash || activeTab.isDirty ? 'var(--color-accent)' : 'var(--color-text-muted)')}
          >
            {savedFlash ? <Check size={15} /> : <Save size={15} />}
            <span>{savedFlash ? 'Tersimpan' : isLinked ? 'Simpan' : 'Simpan ke…'}</span>
            {activeTab.isDirty && !savedFlash && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
            )}
          </button>
        )}
      </div>

      <PanelGroup direction="vertical" style={{ flex: 1 }}>
        <Panel defaultSize={45} minSize={20}>
          <RequestTabs request={activeTab.request} onUpdate={handleUpdate} />
        </Panel>

        <PanelResizeHandle style={{ height: 4, background: 'var(--color-border)', cursor: 'row-resize' }} />

        <Panel defaultSize={55} minSize={20}>
          {activeTab.response ? (
            <ResponseViewer response={activeTab.response} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Response akan muncul di sini setelah Send.
              </p>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>
  )
}
