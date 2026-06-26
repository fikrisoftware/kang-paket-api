import type { PaketRequest, PaketResponse } from './request'
import type { WorkspaceTree } from './project'
import type { RequestItem } from './collection'
import type { HistoryEntry } from './history'

declare global {
  interface Window {
    electronAPI: {
      executeRequest: (req: PaketRequest) => Promise<PaketResponse>
      pickFolder: () => Promise<string | null>
      openProject: () => Promise<WorkspaceTree | null>
      createProject: (dirPath: string, name: string) => Promise<WorkspaceTree>
      saveRequest: (projectPath: string, collectionName: string, req: RequestItem) => Promise<void>
      deleteRequest: (filePath: string) => Promise<void>
      loadProject: (projectPath: string) => Promise<WorkspaceTree>
      getHistory: () => Promise<HistoryEntry[]>
      clearHistory: () => Promise<void>
      importFile: () => Promise<WorkspaceTree | null>
      exportCollection: (collection: RequestItem[], format: string) => Promise<void>
    }
  }
}
