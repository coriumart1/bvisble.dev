// backend/db/documents.ts
import { getDb } from './database'

export interface Document {
  id: number
  title: string
  content: string
  folder_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateDocumentData {
  title: string
  content?: string
  folder_id?: number | null
}

export interface UpdateDocumentData {
  title?: string
  content?: string
  folder_id?: number | null
}

export function getAllDocuments(folderId?: number): Document[] {
  const db = getDb()
  if (folderId !== undefined) {
    return db
      .prepare('SELECT * FROM documents WHERE folder_id = ? ORDER BY updated_at DESC')
      .all(folderId) as Document[]
  }
  return db.prepare('SELECT * FROM documents ORDER BY updated_at DESC').all() as Document[]
}

export function getDocumentById(id: number): Document | null {
  return getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document | null
}

export function createDocument(data: CreateDocumentData): Document {
  return getDb()
    .prepare('INSERT INTO documents (title, content, folder_id) VALUES (?, ?, ?) RETURNING *')
    .get(data.title, data.content ?? '', data.folder_id ?? null) as Document
}

export function updateDocument(id: number, data: UpdateDocumentData): Document {
  const db = getDb()
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title) }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content) }
  if ('folder_id' in data) { fields.push('folder_id = ?'); values.push(data.folder_id ?? null) }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  return db
    .prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ? RETURNING *`)
    .get(...values) as Document
}

export function deleteDocument(id: number): void {
  getDb().prepare('DELETE FROM documents WHERE id = ?').run(id)
}
