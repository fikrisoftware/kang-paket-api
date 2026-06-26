import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import type { WorkspaceTree, ProjectMeta } from '../../src/types/project'
import type { RequestItem } from '../../src/types/collection'

function scaffoldProject(dirPath: string, name: string): void {
  fs.mkdirSync(path.join(dirPath, 'environments'), { recursive: true })
  fs.mkdirSync(path.join(dirPath, 'collections'), { recursive: true })
  const meta: ProjectMeta = { name, version: '1', createdAt: new Date().toISOString() }
  fs.writeFileSync(path.join(dirPath, 'kangpaket.project.json'), JSON.stringify(meta, null, 2))
}

function readProjectTree(dirPath: string): WorkspaceTree {
  const metaPath = path.join(dirPath, 'kangpaket.project.json')
  const meta: ProjectMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  const collectionsDir = path.join(dirPath, 'collections')
  const requests: RequestItem[] = []

  if (fs.existsSync(collectionsDir)) {
    const walkDir = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkDir(full)
        else if (entry.name.endsWith('.kp.json')) {
          const req: RequestItem = JSON.parse(fs.readFileSync(full, 'utf-8'))
          req.filePath = full
          requests.push(req)
        }
      }
    }
    walkDir(collectionsDir)
  }

  return { projectPath: dirPath, meta, requests }
}

export function registerFsHandlers(): void {
  ipcMain.handle('fs:openProject', async (): Promise<WorkspaceTree | null> => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || !result.filePaths[0]) return null
    const dirPath = result.filePaths[0]
    const metaPath = path.join(dirPath, 'kangpaket.project.json')
    if (!fs.existsSync(metaPath)) return null
    return readProjectTree(dirPath)
  })

  ipcMain.handle('fs:createProject', async (_e, dirPath: string, name: string): Promise<WorkspaceTree> => {
    scaffoldProject(dirPath, name)
    return readProjectTree(dirPath)
  })

  ipcMain.handle('fs:loadProject', async (_e, projectPath: string): Promise<WorkspaceTree> => {
    return readProjectTree(projectPath)
  })

  ipcMain.handle('fs:saveRequest', async (_e, projectPath: string, collectionName: string, req: RequestItem): Promise<void> => {
    const collDir = path.join(projectPath, 'collections', collectionName)
    fs.mkdirSync(collDir, { recursive: true })
    const filePath = req.filePath ?? path.join(collDir, `${req.id}.kp.json`)
    fs.writeFileSync(filePath, JSON.stringify(req, null, 2))
  })

  ipcMain.handle('fs:deleteRequest', async (_e, filePath: string): Promise<void> => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  })
}
