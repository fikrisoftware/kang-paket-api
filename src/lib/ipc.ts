import type { NyiruRequest, NyiruResponse } from '../types/request'
import type { WorkspaceTree } from '../types/project'
import type { RequestItem } from '../types/collection'
import type { HistoryEntry } from '../types/history'

export const ipc = {
  executeRequest: (req: NyiruRequest): Promise<NyiruResponse> =>
    window.electronAPI.executeRequest(req),

  pickFolder: (): Promise<string | null> =>
    window.electronAPI.pickFolder(),

  openProject: (): Promise<WorkspaceTree | null> =>
    window.electronAPI.openProject(),

  createProject: (dirPath: string, name: string): Promise<WorkspaceTree> =>
    window.electronAPI.createProject(dirPath, name),

  saveRequest: (projectPath: string, collectionName: string, req: RequestItem): Promise<void> =>
    window.electronAPI.saveRequest(projectPath, collectionName, req),

  deleteRequest: (filePath: string): Promise<void> =>
    window.electronAPI.deleteRequest(filePath),

  loadProject: (projectPath: string): Promise<WorkspaceTree> =>
    window.electronAPI.loadProject(projectPath),

  getHistory: (): Promise<HistoryEntry[]> =>
    window.electronAPI.getHistory(),

  clearHistory: (): Promise<void> =>
    window.electronAPI.clearHistory(),

  importFile: (): Promise<WorkspaceTree | null> =>
    window.electronAPI.importFile(),

  exportCollection: (collection: RequestItem[], format: string): Promise<void> =>
    window.electronAPI.exportCollection(collection, format)
}
