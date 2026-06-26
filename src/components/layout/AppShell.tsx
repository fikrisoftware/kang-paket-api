import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { useUiStore } from '../../store/uiStore'
import { useActiveTab } from '../../store/tabStore'

export function AppShell(): JSX.Element {
  const { theme, sidebarOpen } = useUiStore()
  const activeTab = useActiveTab()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex flex-col h-full w-full" style={{ background: 'var(--color-bg)' }}>
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" style={{ flex: 1 }}>
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <Panel defaultSize={20} minSize={12} maxSize={35}>
                <Sidebar />
              </Panel>
              <PanelResizeHandle
                style={{
                  width: 4,
                  background: 'var(--color-border)',
                  cursor: 'col-resize',
                  flexShrink: 0
                }}
              />
            </>
          )}

          {/* Main area */}
          <Panel minSize={40}>
            <div className="flex flex-col h-full">
              <TabBar />

              {/* Request / Response area — placeholder untuk Fase 2 */}
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                {activeTab?.request.url ? (
                  <p className="text-sm">Klik Send untuk menjalankan request.</p>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                      Titip request, balik bawa response.
                    </p>
                    <p className="text-xs">Masukkan URL di atas dan klik Send.</p>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
