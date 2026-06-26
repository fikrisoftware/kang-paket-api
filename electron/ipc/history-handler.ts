import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { HistoryEntry } from '../../src/types/history'

const HISTORY_MAX = 500

function historyPath(): string {
  return path.join(app.getPath('userData'), 'history.json')
}

function readHistory(): HistoryEntry[] {
  const p = historyPath()
  if (!fs.existsSync(p)) return []
  return JSON.parse(fs.readFileSync(p, 'utf-8'))
}

function writeHistory(entries: HistoryEntry[]): void {
  fs.writeFileSync(historyPath(), JSON.stringify(entries, null, 2))
}

export function registerHistoryHandlers(): void {
  ipcMain.handle('history:get', (): HistoryEntry[] => readHistory())

  ipcMain.handle('history:append', (_e, entry: HistoryEntry): void => {
    const entries = [entry, ...readHistory()].slice(0, HISTORY_MAX)
    writeHistory(entries)
  })

  ipcMain.handle('history:clear', (): void => writeHistory([]))
}
