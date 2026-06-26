import { useState } from 'react'
import { Save } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { UrlBar } from './UrlBar'
import { RequestTabs } from './RequestTabs'
import { ResponseViewer } from '../response/ResponseViewer'
import { SaveRequestDialog } from './SaveRequestDialog'
import { useTabStore, useActiveTab } from '../../store/tabStore'
import { useProjectStore } from '../../store/projectStore'
import { ipc } from '../../lib/ipc'
import type { PaketRequest } from '../../types/request'
import type { RequestItem } from '../../types/collection'
import { v4 as uuidv4 } from 'uuid'

export function RequestPanel(): JSX.Element {
  const activeTab = useActiveTab()
  const { updateRequest, updateTab, activeTabId } = useTabStore()
  const { workspace, setWorkspace } = useProjectStore()
  const [showSave, setShowSave] = useState(false)

  if (!activeTab) return <></>

  function handleUpdate(patch: Partial<PaketRequest>): void {
    updateRequest(activeTabId, patch)
    if (patch.url !== undefined) {
      const urlName = patch.url.split('?')[0].split('/').pop() || 'New Request'
      if (urlName) updateTab(activeTabId, { name: urlName })
    }
  }

  async function handleSend(): Promise<void> {
    if (!activeTab?.request.url.trim()) return
    updateTab(activeTabId, { isLoading: true, response: null })
    try {
      const response = await ipc.executeRequest(activeTab.request)
      updateTab(activeTabId, { response, isLoading: false, isDirty: false })
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

  async function handleSave(name: string, collectionName: string): Promise<void> {
    if (!workspace) return
    setShowSave(false)
    const req: RequestItem = {
      ...(activeTab!.request as PaketRequest),
      id: uuidv4(),
      name,
      collectionName,
      meta: { createdAt: new Date().toISOString() }
    }
    await ipc.saveRequest(workspace.projectPath, collectionName, req)
    const updated = await ipc.loadProject(workspace.projectPath)
    setWorkspace(updated)
    updateTab(activeTabId, { name, isDirty: false })
  }

  return (
    <div className="flex flex-col h-full">
      {showSave && workspace && (
        <SaveRequestDialog
          defaultName={activeTab?.name ?? 'New Request'}
          onClose={() => setShowSave(false)}
          onConfirm={handleSave}
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
        {workspace && (
          <button
            onClick={() => setShowSave(true)}
            title="Simpan request ke collection"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 14px', height: 36, fontSize: 12, cursor: 'pointer',
              background: 'transparent', color: 'var(--color-text-muted)',
              border: '0', borderLeft: '1px solid var(--color-border)',
              transition: 'color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <Save size={13} />
            <span>Simpan</span>
          </button>
        )}
      </div>

      <PanelGroup direction="vertical" style={{ flex: 1 }}>
        <Panel defaultSize={45} minSize={20}>
          <RequestTabs request={activeTab.request} onUpdate={handleUpdate} />
        </Panel>

        {activeTab.response && (
          <>
            <PanelResizeHandle style={{ height: 4, background: 'var(--color-border)', cursor: 'row-resize' }} />
            <Panel defaultSize={55} minSize={20}>
              <ResponseViewer response={activeTab.response} />
            </Panel>
          </>
        )}

        {!activeTab.response && !activeTab.isLoading && (
          <Panel defaultSize={55} minSize={20}>
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Response akan muncul di sini setelah Send.
              </p>
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  )
}
