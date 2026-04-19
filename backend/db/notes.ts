import { getDb } from './database'

export interface Note {
  id: number
  project_id: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface CreateNoteData { project_id: number; title: string; content?: string }
export interface UpdateNoteData { title?: string; content?: string }

export function getNotesByProject(projectId: number): Note[] {
  return getDb().prepare(
    'SELECT * FROM notes WHERE project_id = ? ORDER BY updated_at DESC'
  ).all(projectId) as Note[]
}

export function getNoteById(id: number): Note | null {
  return (getDb().prepare('SELECT * FROM notes WHERE id = ?').get(id) as Note) ?? null
}

export function createNote(data: CreateNoteData): Note {
  const result = getDb().prepare(
    'INSERT INTO notes (project_id, title, content) VALUES (?, ?, ?)'
  ).run(data.project_id, data.title, data.content ?? null)
  return getNoteById(result.lastInsertRowid as number)!
}

export function updateNote(id: number, data: UpdateNoteData): Note {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title) }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content) }
  if (fields.length === 0) return getNoteById(id)!
  fields.push("updated_at = datetime('now')")
  db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values, id)
  return getNoteById(id)!
}

export function deleteNote(id: number): void {
  getDb().prepare('DELETE FROM notes WHERE id = ?').run(id)
}
