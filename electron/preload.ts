import { contextBridge, ipcRenderer } from 'electron'
import type { NyiruRequest, NyiruResponse } from '../src/types/request'
import type { ProjectMeta, WorkspaceTree } from '../src/types/project'
import type { RequestItem } from '../src/types/collection'
import type { HistoryEntry } from '../src/types/history'

contextBridge.exposeInMainWorld('electronAPI', {
  // HTTP
  executeRequest: (req: NyiruRequest): Promise<NyiruResponse> =>
    ipcRenderer.invoke('http:execute', req),

  // Project / File system
  pickFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('fs:pickFolder'),
  openProject: (): Promise<WorkspaceTree | null> =>
    ipcRenderer.invoke('fs:openProject'),
  createProject: (dirPath: string, name: string): Promise<WorkspaceTree> =>
    ipcRenderer.invoke('fs:createProject', dirPath, name),
  saveRequest: (projectPath: string, collectionPath: string, req: RequestItem): Promise<void> =>
    ipcRenderer.invoke('fs:saveRequest', projectPath, collectionPath, req),
  deleteRequest: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('fs:deleteRequest', filePath),
  loadProject: (projectPath: string): Promise<WorkspaceTree> =>
    ipcRenderer.invoke('fs:loadProject', projectPath),

  // History
  getHistory: (): Promise<HistoryEntry[]> =>
    ipcRenderer.invoke('history:get'),
  clearHistory: (): Promise<void> =>
    ipcRenderer.invoke('history:clear'),

  // Import
  importFile: (): Promise<WorkspaceTree | null> =>
    ipcRenderer.invoke('import:openAndParse'),

  // Export
  exportCollection: (collection: RequestItem[], format: string): Promise<void> =>
    ipcRenderer.invoke('export:generate', collection, format)
})
