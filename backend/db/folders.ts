// backend/db/folders.ts
import { getDb } from './database'

export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_at: string
}

export interface CreateFolderData {
  name: string
  parent_id?: number | null
}

export function getAllFolders(): Folder[] {
  return getDb().prepare('SELECT * FROM folders ORDER BY name').all() as Folder[]
}

export function getFolderById(id: number): Folder | null {
  return getDb().prepare('SELECT * FROM folders WHERE id = ?').get(id) as Folder | null
}

export function createFolder(data: CreateFolderData): Folder {
  return getDb()
    .prepare('INSERT INTO folders (name, parent_id) VALUES (?, ?) RETURNING *')
    .get(data.name, data.parent_id ?? null) as Folder
}

export function updateFolder(id: number, name: string): Folder {
  return getDb()
    .prepare('UPDATE folders SET name = ? WHERE id = ? RETURNING *')
    .get(name, id) as Folder
}

export function deleteFolder(id: number): void {
  getDb().prepare('DELETE FROM folders WHERE id = ?').run(id)
}

export function isFolderEmpty(id: number): boolean {
  const db = getDb()
  const docCount = db
    .prepare('SELECT COUNT(*) as count FROM documents WHERE folder_id = ?')
    .get(id) as { count: number }
  const subCount = db
    .prepare('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?')
    .get(id) as { count: number }
  return docCount.count === 0 && subCount.count === 0
}
