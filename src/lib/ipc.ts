import type { PaketRequest, PaketResponse } from '../types/request'
import type { WorkspaceTree } from '../types/project'
import type { RequestItem } from '../types/collection'
import type { HistoryEntry } from '../types/history'

// Catatan: window.electronAPI hanya tersedia saat dijalankan di dalam aplikasi
// Electron (di-expose lewat preload). Jika file ini dibuka di browser biasa
// (mis. localhost:5173), API tidak ada — semua fungsi di sini memberi nilai
// default yang aman agar UI tidak crash, bukan melempar error sinkron.

let warned = false
function unavailable(): null {
  if (!warned) {
    warned = true
    console.warn(
      '[Kang Paket] window.electronAPI tidak tersedia. ' +
      'Buka aplikasi lewat window Electron, bukan di browser.'
    )
  }
  return null
}

const api = (): Window['electronAPI'] | undefined =>
  typeof window !== 'undefined' ? window.electronAPI : undefined

export const ipc = {
  executeRequest: (req: PaketRequest): Promise<PaketResponse> => {
    const a = api()
    if (!a) { unavailable(); return Promise.reject(new Error('electronAPI tidak tersedia')) }
    return a.executeRequest(req)
  },

  pickFolder: (): Promise<string | null> =>
    api()?.pickFolder() ?? (unavailable(), Promise.resolve(null)),

  openProject: (): Promise<WorkspaceTree | null> =>
    api()?.openProject() ?? (unavailable(), Promise.resolve(null)),

  createProject: (dirPath: string, name: string): Promise<WorkspaceTree> => {
    const a = api()
    if (!a) { unavailable(); return Promise.reject(new Error('electronAPI tidak tersedia')) }
    return a.createProject(dirPath, name)
  },

  saveRequest: (projectPath: string, collectionName: string, req: RequestItem): Promise<void> =>
    api()?.saveRequest(projectPath, collectionName, req) ?? (unavailable(), Promise.resolve()),

  deleteRequest: (filePath: string): Promise<void> =>
    api()?.deleteRequest(filePath) ?? (unavailable(), Promise.resolve()),

  loadProject: (projectPath: string): Promise<WorkspaceTree> => {
    const a = api()
    if (!a) { unavailable(); return Promise.reject(new Error('electronAPI tidak tersedia')) }
    return a.loadProject(projectPath)
  },

  getHistory: (): Promise<HistoryEntry[]> =>
    api()?.getHistory() ?? (unavailable(), Promise.resolve([])),

  appendHistory: (entry: HistoryEntry): Promise<void> =>
    api()?.appendHistory(entry) ?? (unavailable(), Promise.resolve()),

  clearHistory: (): Promise<void> =>
    api()?.clearHistory() ?? (unavailable(), Promise.resolve()),

  importFile: (): Promise<WorkspaceTree | null> =>
    api()?.importFile() ?? (unavailable(), Promise.resolve(null)),

  exportCollection: (collection: RequestItem[], format: string): Promise<void> =>
    api()?.exportCollection(collection, format) ?? (unavailable(), Promise.resolve())
}
