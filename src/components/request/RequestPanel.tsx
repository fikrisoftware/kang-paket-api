import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { UrlBar } from './UrlBar'
import { RequestTabs } from './RequestTabs'
import { ResponseViewer } from '../response/ResponseViewer'
import { useTabStore, useActiveTab } from '../../store/tabStore'
import { ipc } from '../../lib/ipc'
import type { NyiruRequest } from '../../types/request'

export function RequestPanel(): JSX.Element {
  const activeTab = useActiveTab()
  const { updateRequest, updateTab, activeTabId } = useTabStore()

  if (!activeTab) return <></>

  function handleUpdate(patch: Partial<NyiruRequest>): void {
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

  return (
    <div className="flex flex-col h-full">
      <UrlBar
        method={activeTab.request.method}
        url={activeTab.request.url}
        isLoading={activeTab.isLoading}
        onMethodChange={(method) => handleUpdate({ method })}
        onUrlChange={(url) => handleUpdate({ url })}
        onSend={handleSend}
      />

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
