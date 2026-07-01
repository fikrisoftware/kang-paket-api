import { useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { RequestPanel } from '../request/RequestPanel'
import { useUiStore } from '../../store/uiStore'

export function AppShell(): JSX.Element {
  const { theme, sidebarOpen } = useUiStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Remove legacy 'dark' class that may have been set by old code
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

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

              <div className="flex-1 overflow-hidden">
                <RequestPanel />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
